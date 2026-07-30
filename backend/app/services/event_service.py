from app.services.ai_pipeline import process_event
from datetime import datetime

from sqlalchemy.orm import Session

from app.config.settings import settings
from app.schemas.event import EventCreate
from app.database.database import SessionLocal
from app.integrations.news_api import fetch_supply_chain_news
from app.integrations.weather_api import fetch_weather_data
from app.crud.event import save_normalized_event
from app.utils.logger import logger


# --------------------------------------------------
# NEWS NORMALIZATION
# --------------------------------------------------
def normalize_news_event(article: dict) -> EventCreate:
    return EventCreate(
        title=article.get("title"),
        description=article.get("description"),
        event_type="News",
        location=settings.DEFAULT_EVENT_LOCATION,
        source=article.get("source"),
        url=article.get("url"),
        severity=settings.DEFAULT_EVENT_SEVERITY,
        status=settings.DEFAULT_EVENT_STATUS,
        event_time=datetime.fromisoformat(
            article.get("published_at").replace("Z", "+00:00")
        ) if article.get("published_at") else None,
    )


# --------------------------------------------------
# WEATHER NORMALIZATION
# --------------------------------------------------
def normalize_weather_event(weather: dict) -> EventCreate:
    return EventCreate(
        title=weather.get("condition"),
        description=(
            f"Temperature: {weather.get('temperature')}°C | "
            f"Humidity: {weather.get('humidity')}%"
        ),
        event_type="Weather",
        location=weather.get("location"),
        source="WeatherAPI",
        severity=settings.DEFAULT_EVENT_SEVERITY,
        status=settings.DEFAULT_EVENT_STATUS,
        event_time=datetime.strptime(
            weather.get("last_updated"),
            "%Y-%m-%d %H:%M"
        ) if weather.get("last_updated") else None,
    )


# --------------------------------------------------
# STORE NEWS EVENTS
# --------------------------------------------------
def store_news_events(db: Session):
    logger.info("Fetching latest news events...")

    articles = fetch_supply_chain_news()

    if isinstance(articles, dict) and articles.get("status") == "error":
        logger.error(f"News API Error: {articles.get('message')}")
        return articles

    logger.info(f"{len(articles)} news articles fetched.")

    saved_events = []

    for article in articles:
        event = normalize_news_event(article)

        # Save Event
        saved_event = save_normalized_event(
            db,
            event.model_dump(),
        )

        # Automatically run AI Pipeline
        process_event(
            db=db,
            event=saved_event,
        )

        saved_events.append(saved_event)

    logger.info(f"{len(saved_events)} news events processed.")

    return {
        "message": f"{len(saved_events)} news events processed successfully.",
        "events": saved_events,
    }

# --------------------------------------------------
# STORE WEATHER EVENT
# --------------------------------------------------
def store_weather_event(db: Session):
    logger.info("Fetching latest weather event...")

    weather = fetch_weather_data()

    if isinstance(weather, dict) and weather.get("status") == "error":
        logger.error(f"Weather API Error: {weather.get('message')}")
        return weather

    event = normalize_weather_event(weather)

    # Save Event
    saved_event = save_normalized_event(
        db,
        event.model_dump(),
    )

    # Automatically run AI Pipeline
    process_event(
        db=db,
        event=saved_event,
    )

    logger.info("Weather event processed successfully.")

    return {
        "message": "Weather event processed successfully.",
        "event": saved_event,
    }

# --------------------------------------------------
# SCHEDULER FUNCTION
# --------------------------------------------------
def collect_news_events():
    logger.info("Scheduler triggered.")

    db = SessionLocal()

    try:
        store_news_events(db)
        logger.info("Scheduler completed successfully.")

    except Exception as e:
        logger.exception(f"Scheduler failed: {str(e)}")

    finally:
        db.close()