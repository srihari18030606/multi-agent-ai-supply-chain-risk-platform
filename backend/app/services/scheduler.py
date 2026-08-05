from apscheduler.schedulers.background import BackgroundScheduler

from app.config.settings import settings
from app.services.event_service import collect_news_events
from app.utils.logger import logger

scheduler = BackgroundScheduler()


def start_scheduler():
    if not scheduler.running:

        scheduler.add_job(
            collect_news_events,
            trigger="interval",
            minutes=settings.SCHEDULER_INTERVAL_SECONDS,
            id="news_collection",
            replace_existing=True,
        )

        scheduler.start()

        logger.info(
            f"Scheduler started successfully. Interval: {settings.SCHEDULER_INTERVAL_SECONDS} second(s)."
        )


def stop_scheduler():
    if scheduler.running:

        scheduler.shutdown()

        logger.info("Scheduler stopped successfully.")