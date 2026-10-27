
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const weatherContainer = document.getElementById("weatherContainer");

const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");
const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const latitude = document.getElementById("latitude");
const longitude = document.getElementById("longitude");
const weatherDescription = document.getElementById("weatherDescription");
const weatherIcon = document.getElementById("weatherIcon");
const weatherTime = document.getElementById("weatherTime");

const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

let isSearching = false;
let activeController = null;

function setLoading(isLoading) {
    loading.hidden = !isLoading;
    searchForm.querySelector("button[type='submit']").disabled = isLoading;
    cityInput.disabled = isLoading;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
}

function clearError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
}

async function fetchJSON(url, signal) {
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(
            response.status === 429
                ? "Too many requests. Please wait and try again."
                : "Weather service is temporarily unavailable."
        );
    }

    return response.json();
}

async function getCityCoordinates(city, signal) {
    const url =
        `${GEOCODING_API}?name=${encodeURIComponent(city)}` +
        "&count=1&language=en&format=json";

    const data = await fetchJSON(url, signal);

    if (!data.results?.length) {
        throw new Error(
            `City "${city}" was not found. Check the spelling and try again.`
        );
    }

    return data.results[0];
}

async function getWeather(lat, lon, signal) {
    const url =
        `${WEATHER_API}?latitude=${lat}&longitude=${lon}` +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
        "&timezone=auto";

    const data = await fetchJSON(url, signal);

    if (!data.current) {
        throw new Error("Current weather data is unavailable.");
    }

    return data;
}

function getWeatherDescription(code) {
    const descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Heavy rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with light hail",
        99: "Thunderstorm with heavy hail"
    };

    return descriptions[code] || "Weather conditions unavailable";
}

function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if ([45, 48].includes(code)) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95 && code <= 99) return "⛈️";

    return "🌡️";
}

function renderWeather(location, weather) {
    const current = weather.current;

    cityName.textContent = location.name;
    countryName.textContent = [
        location.admin1,
        location.country
    ].filter(Boolean).join(", ");

    temperature.textContent = current.temperature_2m ?? "--";
    humidity.textContent = current.relative_humidity_2m ?? "--";
    windSpeed.textContent = current.wind_speed_10m ?? "--";

    latitude.textContent = Number(location.latitude).toFixed(2);
    longitude.textContent = Number(location.longitude).toFixed(2);

    weatherDescription.textContent =
        getWeatherDescription(current.weather_code);

    weatherIcon.textContent = getWeatherIcon(current.weather_code);

    weatherTime.textContent =
        current.time?.replace("T", " ") || "Unavailable";

    weatherContainer.hidden = false;
}

async function searchWeather(city) {
    if (isSearching) return;

    isSearching = true;
    activeController = new AbortController();

    setLoading(true);
    clearError();

    try {
        const location = await getCityCoordinates(
            city,
            activeController.signal
        );

        const weather = await getWeather(
            location.latitude,
            location.longitude,
            activeController.signal
        );

        renderWeather(location, weather);
    } catch (error) {
        if (error.name === "AbortError") return;

        showError(
            error instanceof TypeError
                ? "Network error. Check your internet connection and try again."
                : error.message || "Something went wrong. Please try again."
        );
    } finally {
        isSearching = false;
        activeController = null;
        setLoading(false);
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        clearError();
        showError("Please enter a city name.");
        cityInput.focus();
        return;
    }

    searchWeather(city);
});

// Load a default city when the page opens.
searchWeather("Delhi");
