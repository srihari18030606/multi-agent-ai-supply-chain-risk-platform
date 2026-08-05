import requests

from app.config.settings import settings
from app.utils.logger import logger


# --------------------------------------------------
# SUPPLY CHAIN KEYWORDS
# --------------------------------------------------
SUPPLY_CHAIN_KEYWORDS = [
    "supply chain",
    "logistics",
    "shipping",
    "ship",
    "freight",
    "cargo",
    "warehouse",
    "transport",
    "transportation",
    "port",
    "harbor",
    "terminal",
    "container",
    "customs",
    "import",
    "export",
    "supplier",
    "procurement",
    "manufacturing",
    "factory",
    "production",
    "distribution",
    "inventory",
    "rail",
    "truck",
    "road",
    "air freight",
    "sea freight",
    "semiconductor",
    "oil",
    "gas",
    "energy",
    "pipeline",
    "strike",
    "flood",
    "earthquake",
    "cyclone",
    "hurricane",
    "storm",
]


# --------------------------------------------------
# CHECK ARTICLE RELEVANCE
# --------------------------------------------------
def is_supply_chain_related(article: dict) -> bool:
    """
    Check whether a news article is related to supply chain.
    """

    text = (
        f"{article.get('title', '')} "
        f"{article.get('description', '')}"
    ).lower()

    return any(
        keyword in text
        for keyword in SUPPLY_CHAIN_KEYWORDS
    )


# --------------------------------------------------
# FETCH NEWS
# --------------------------------------------------
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

        total_articles = len(data.get("articles", []))
        accepted_articles = 0
        skipped_articles = 0

        logger.info(f"Total Articles Received: {total_articles}")

        for article in data.get("articles", []):

            if not is_supply_chain_related(article):
                skipped_articles += 1
                logger.info(f"❌ Skipped : {article.get('title')}")
                continue

            accepted_articles += 1
            logger.info(f"✅ Accepted: {article.get('title')}")

            articles.append(
                {
                    "title": article.get("title"),
                    "description": article.get("description"),
                    "source": article.get("source", {}).get("name"),
                    "published_at": article.get("publishedAt"),
                    "url": article.get("url"),
                }
            )

        logger.info("=" * 60)
        logger.info(f"Total Articles   : {total_articles}")
        logger.info(f"Accepted Articles: {accepted_articles}")
        logger.info(f"Skipped Articles : {skipped_articles}")
        logger.info("=" * 60)

        return articles

    except requests.exceptions.RequestException as e:
        logger.error(f"NewsAPI request failed: {str(e)}")

        return {
            "status": "error",
            "message": str(e),
        }