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

const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


async function getCityCoordinates(city) {
    const url =
        `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to search for the city.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please enter a valid city name.");
    }

    return data.results[0];
}


async function getWeather(latitude, longitude) {
    const url =
        `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to fetch weather data.");
    }

    const data = await response.json();

    if (!data.current) {
        throw new Error("Weather data is unavailable.");
    }

    return data;
}


function getWeatherDescription(code) {
    const weatherCodes = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        95: "Thunderstorm"
    };

    return weatherCodes[code] || "Unknown weather";
}


function getWeatherIcon(code) {
    if (code === 0) {
        return "☀️";
    }

    if (code === 1 || code === 2) {
        return "🌤️";
    }

    if (code === 3) {
        return "☁️";
    }

    if (code === 45 || code === 48) {
        return "🌫️";
    }

    if (code >= 51 && code <= 67) {
        return "🌧️";
    }

    if (code >= 71 && code <= 77) {
        return "❄️";
    }

    if (code >= 80 && code <= 82) {
        return "🌦️";
    }

    if (code >= 95) {
        return "⛈️";
    }

    return "🌤️";
}


function renderWeather(location, weather) {
    const current = weather.current;

    cityName.textContent = location.name;

    countryName.textContent =
        `${location.admin1 || ""}, ${location.country || ""}`;

    temperature.textContent =
        current.temperature_2m;

    humidity.textContent =
        current.relative_humidity_2m;

    windSpeed.textContent =
        current.wind_speed_10m;

    latitude.textContent =
        location.latitude.toFixed(2);

    longitude.textContent =
        location.longitude.toFixed(2);

    weatherDescription.textContent =
        getWeatherDescription(current.weather_code);

    weatherIcon.textContent =
        getWeatherIcon(current.weather_code);

    weatherTime.textContent =
        current.time.replace("T", " ");

    weatherContainer.style.display = "block";
}


async function searchWeather(city) {
    try {
        loading.style.display = "block";
        errorMessage.style.display = "none";
        weatherContainer.style.display = "none";

        const location = await getCityCoordinates(city);

        const weather = await getWeather(
            location.latitude,
            location.longitude
        );

        renderWeather(location, weather);

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";

    } finally {
        loading.style.display = "none";
    }
}


searchForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city === "") {
        errorMessage.textContent = "Please enter a city name.";
        errorMessage.style.display = "block";
        return;
    }

    searchWeather(city);
});


searchWeather("Delhi");