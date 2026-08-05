from sqlalchemy.orm import Session

from app.ai.inference import predict_event

from app.models.event import Event
from app.models.risk import Risk
from app.models.prediction import Prediction

from app.services.recommendation_service import save_generated_recommendation
import time


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
        ↓
    Recommendation
    """

    try:
        pipeline_start = time.perf_counter()
        # -----------------------------------------
        # Validate Event
        # -----------------------------------------
        if not event.description or not event.description.strip():
            raise ValueError("Event description is empty.")

        inference_start = time.perf_counter()
        # -----------------------------------------
        # Run AI Prediction
        # -----------------------------------------
        ai_result = predict_event(
            event.description,
            event.location,
        )
        inference_time = time.perf_counter() - inference_start

        print(
            f"AI Inference Time: "
            f"{inference_time:.3f} seconds"
        )

        # -----------------------------------------
        # Create Risk Object
        # -----------------------------------------
        risk = Risk(
            risk_name=ai_result["category"],
            risk_type=ai_result["category"],
            risk_score=ai_result["confidence"] * 100,
            severity=ai_result["severity"],
            probability=ai_result["confidence"],
            status="Active",
            event_id=event.id,
        )

        db.add(risk)

        # Generate risk.id before creating prediction
        db.flush()

        # -----------------------------------------
        # Determine Prediction Status
        # -----------------------------------------
        confidence = ai_result["confidence"]

        if confidence >= 0.80:
            prediction_status = "Generated"
        elif confidence >= 0.60:
            prediction_status = "Needs Review"
        else:
            prediction_status = "Low Confidence"

        print(
            f"AI Prediction -> "
            f"Category: {ai_result['category']}, "
            f"Severity: {ai_result['severity']}, "
            f"Confidence: {confidence:.2f}, "
            f"Status: {prediction_status}"
        )

        # -----------------------------------------
        # Create Prediction Object
        # -----------------------------------------
        prediction = Prediction(
            predicted_risk=ai_result["category"],
            confidence_score=confidence,
            predicted_severity=ai_result["severity"],
            prediction_model="DistilBERT + XGBoost",
            prediction_status=prediction_status,
            risk_id=risk.id,
        )

        db.add(prediction)

        # Commit Risk & Prediction
        db.commit()

        db.refresh(risk)
        db.refresh(prediction)

        # -----------------------------------------
        # Generate & Save Recommendation
        # -----------------------------------------
        recommendation = save_generated_recommendation(
            db=db,
            prediction_id=prediction.id,
            category=prediction.predicted_risk,
            severity=prediction.predicted_severity,
        )
        
        pipeline_time = time.perf_counter() - pipeline_start

        print(
            f"Pipeline Execution Time: "
            f"{pipeline_time:.3f} seconds"
        )

        return {
            "event": event,
            "risk": risk,
            "prediction": prediction,
            "recommendation": recommendation,
            "ai_result": ai_result,
        }

    except Exception as e:
        db.rollback()
        raise RuntimeError(f"AI Pipeline Failed: {str(e)}")