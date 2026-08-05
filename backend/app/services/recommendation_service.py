from sqlalchemy.orm import Session

from app.ai.recommendation_engine import generate_recommendation
from app.crud.recommendation import create_recommendation
from app.schemas.recommendation import RecommendationCreate


def save_generated_recommendation(
    db: Session,
    prediction_id: int,
    category: str,
    severity: str,
):
    """
    Generate a recommendation using the AI recommendation engine
    and save it to the database.
    """

    recommendation = generate_recommendation(
        category=category,
        severity=severity,
    )

    recommendation_data = RecommendationCreate(
        prediction_id=prediction_id,
        recommendation_title=recommendation["title"],
        recommendation_text=recommendation["description"],
        priority=recommendation["priority"],
        status="Generated",
    )

    saved_recommendation = create_recommendation(
        db=db,
        recommendation=recommendation_data,
    )

    return saved_recommendation