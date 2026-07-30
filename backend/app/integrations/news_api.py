import requests

from app.config.settings import settings
from app.utils.logger import logger


def fetch_supply_chain_news():
    """
    Fetch supply chain related news from NewsAPI.
    """

    params = {
        "q": settings.NEWS_SEARCH_QUERY,
        "language": settings.NEWS_LANGUAGE,
        "sortBy": "publishedAt",
        "pageSize": settings.NEWS_PAGE_SIZE,
        "apiKey": settings.NEWS_API_KEY,
    }

    try:
        logger.info("Requesting latest news from NewsAPI...")

        response = requests.get(
            settings.NEWS_API_BASE_URL,
            params=params,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        articles = []

        for article in data.get("articles", []):
            articles.append(
                {
                    "title": article.get("title"),
                    "description": article.get("description"),
                    "source": article.get("source", {}).get("name"),
                    "published_at": article.get("publishedAt"),
                    "url": article.get("url"),
                }
            )

        logger.info(f"Successfully fetched {len(articles)} news articles.")

        return articles

    except requests.exceptions.RequestException as e:
        logger.error(f"NewsAPI request failed: {str(e)}")

        return {
            "status": "error",
            "message": str(e),
        }