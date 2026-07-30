import requests

from app.config.settings import settings
from app.utils.logger import logger


def fetch_weather_data():
    """
    Fetch current weather for the configured logistics hub.
    """

    params = {
        "key": settings.WEATHER_API_KEY,
        "q": settings.DEFAULT_WEATHER_CITY,
        "aqi": "no",
    }

    try:
        logger.info(
            f"Requesting weather data for {settings.DEFAULT_WEATHER_CITY}..."
        )

        response = requests.get(
            settings.WEATHER_API_BASE_URL,
            params=params,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        weather = {
            "location": data["location"]["name"],
            "country": data["location"]["country"],
            "temperature": data["current"]["temp_c"],
            "condition": data["current"]["condition"]["text"],
            "wind_kph": data["current"]["wind_kph"],
            "humidity": data["current"]["humidity"],
            "last_updated": data["current"]["last_updated"],
        }

        logger.info("Weather data fetched successfully.")

        return weather

    except requests.exceptions.RequestException as e:
        logger.error(f"Weather API request failed: {str(e)}")

        return {
            "status": "error",
            "message": str(e),
        }