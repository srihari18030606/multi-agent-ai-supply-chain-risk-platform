from sqlalchemy.orm import Session

from app.ai.inference import predict_event

from app.models.event import Event
from app.models.risk import Risk
from app.models.prediction import Prediction


def process_event(
    db: Session,
    event: Event,
):
    """
    Process an event using the AI pipeline.

    Flow:

    Event
        ↓
    DistilBERT
        ↓
    XGBoost
        ↓
    Risk
        ↓
    Prediction
    """

    # Validate event description
    if not event.description:
        raise ValueError("Event description is empty.")

    # Run AI prediction
    ai_result = predict_event(
    event.description,
    event.location,
)

    # Create Risk object
    risk = Risk(
        risk_name=ai_result["category"],
        risk_type=ai_result["category"],
        risk_score=ai_result["confidence"] * 100,
        severity=ai_result["severity"],
        probability=ai_result["confidence"],
        status="Active",
        event_id=event.id,
    )

    # Add Risk to session
    db.add(risk)

    # Flush to generate risk.id without committing
    db.flush()

    # Create Prediction object
    prediction = Prediction(
        predicted_risk=ai_result["category"],
        confidence_score=ai_result["confidence"],
        predicted_severity=ai_result["severity"],
        prediction_model="DistilBERT + XGBoost",
        prediction_status="Generated",
        risk_id=risk.id,
    )

    # Add Prediction to session
    db.add(prediction)

    # Commit both Risk and Prediction together
    db.commit()

    # Refresh objects
    db.refresh(risk)
    db.refresh(prediction)

    return {
        "event": event,
        "risk": risk,
        "prediction": prediction,
        "ai_result": ai_result,
    }