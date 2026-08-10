import requests

from app.config.settings import settings
from app.utils.logger import logger
from app.ai.relevance_filter import relevance_filter

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
# CHECK ARTICLE RELEVANCE (Keyword Filter)
# --------------------------------------------------


def is_supply_chain_related(article: dict) -> bool:
    """
    Check whether a news article is related to supply chain
    using the fast keyword filter.
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

    Pipeline:
        NewsAPI
            ↓
        Keyword Filter
            ↓
        AI Relevance Filter
            ↓
        Final Articles
    """

    params = {
        "q": settings.NEWS_SEARCH_QUERY,
        "language": settings.NEWS_LANGUAGE,
        "sortBy": "publishedAt",
        "pageSize": settings.NEWS_PAGE_SIZE,
        "apiKey": settings.NEWS_API_KEY,
    }

    try:
        logger.info("=" * 60)
        logger.info("Starting NewsAPI collection pipeline")
        logger.info("=" * 60)

        logger.info("Requesting latest news from NewsAPI...")

        response = requests.get(
            settings.NEWS_API_BASE_URL,
            params=params,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        articles = []

        # --------------------------------------------------
        # INITIAL STATISTICS
        # --------------------------------------------------

        total_articles = len(data.get("articles", []))

        keyword_passed = 0
        keyword_rejected = 0

        ai_accepted = 0
        ai_rejected = 0

        logger.info(
            f"Total Articles Received: {total_articles}"
        )

        # --------------------------------------------------
        # PROCESS ARTICLES
        # --------------------------------------------------

        for article in data.get("articles", []):

            title = article.get("title", "")
            description = article.get("description", "")

            article_text = f"{title} {description}"

            # --------------------------------------------------
            # STEP 1: KEYWORD FILTER
            # --------------------------------------------------

            if not is_supply_chain_related(article):

                keyword_rejected += 1

                logger.info(
                    f"[KEYWORD FILTER] Rejected | "
                    f"Title={title}"
                )

                continue

            keyword_passed += 1

            logger.info(
                f"[KEYWORD FILTER] Passed | "
                f"Title={title}"
            )

            # --------------------------------------------------
            # STEP 2: AI RELEVANCE FILTER
            # --------------------------------------------------

            relevance_result = relevance_filter.evaluate(
                article_text
            )

            ai_score = relevance_result["score"]
            ai_label = relevance_result["label"]
            ai_reason = relevance_result["reason"]

            if not relevance_result["accepted"]:

                ai_rejected += 1

                logger.info(
                    f"[AI FILTER] Rejected | "
                    f"Score={ai_score:.4f} | "
                    f"Label={ai_label} | "
                    f"Reason={ai_reason} | "
                    f"Title={title}"
                )

                continue

            ai_accepted += 1

            logger.info(
                f"[AI FILTER] Accepted | "
                f"Score={ai_score:.4f} | "
                f"Label={ai_label} | "
                f"Title={title}"
            )

            # --------------------------------------------------
            # FINAL ACCEPTED ARTICLE
            # --------------------------------------------------

            articles.append(
                {
                    "title": title,
                    "description": description,
                    "source": article.get(
                        "source", {}
                    ).get("name"),
                    "published_at": article.get(
                        "publishedAt"
                    ),
                    "url": article.get("url"),
                }
            )

            logger.info(
                f"[FINAL] Article Accepted: {title}"
            )

        # --------------------------------------------------
        # CALCULATE STATISTICS
        # --------------------------------------------------

        keyword_pass_rate = (
            (keyword_passed / total_articles) * 100
            if total_articles > 0
            else 0
        )

        ai_acceptance_rate = (
            (ai_accepted / keyword_passed) * 100
            if keyword_passed > 0
            else 0
        )

        final_acceptance_rate = (
            (len(articles) / total_articles) * 100
            if total_articles > 0
            else 0
        )

        # --------------------------------------------------
        # FINAL SUMMARY
        # --------------------------------------------------

        logger.info("=" * 60)
        logger.info("NEWS FILTER SUMMARY")
        logger.info("=" * 60)

        logger.info(
            f"Total Articles Received : {total_articles}"
        )

        logger.info("")
        logger.info("KEYWORD FILTER")
        logger.info(
            f"  Passed                : {keyword_passed}"
        )
        logger.info(
            f"  Rejected              : {keyword_rejected}"
        )
        logger.info(
            f"  Pass Rate             : "
            f"{keyword_pass_rate:.2f}%"
        )

        logger.info("")
        logger.info("AI RELEVANCE FILTER")
        logger.info(
            f"  Accepted              : {ai_accepted}"
        )
        logger.info(
            f"  Rejected              : {ai_rejected}"
        )
        logger.info(
            f"  Acceptance Rate       : "
            f"{ai_acceptance_rate:.2f}%"
        )

        logger.info("")
        logger.info(
            f"FINAL ARTICLES         : {len(articles)}"
        )
        logger.info(
            f"FINAL ACCEPTANCE RATE  : "
            f"{final_acceptance_rate:.2f}%"
        )

        logger.info("=" * 60)

        return articles

    except requests.exceptions.RequestException as e:

        logger.error(
            f"NewsAPI request failed: {str(e)}"
        )

        return {
            "status": "error",
            "message": str(e),
        }