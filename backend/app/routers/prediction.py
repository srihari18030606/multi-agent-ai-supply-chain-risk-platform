from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.crud.prediction import (
    create_prediction,
    get_prediction,
    get_predictions,
    update_prediction,
    delete_prediction,
)
from app.schemas.prediction import (
    PredictionCreate,
    PredictionUpdate,
    PredictionResponse,
)

from app.ai.inference import predict_event
from app.crud.event import get_event
from app.crud.risk import get_risk_by_event
from app.schemas.prediction import PredictionCreate

router = APIRouter(
    prefix="/predictions",
    tags=["Predictions"]
)


@router.post("/", response_model=PredictionResponse)
def create_new_prediction(
    prediction: PredictionCreate,
    db: Session = Depends(get_db),
):
    return create_prediction(db, prediction)


@router.get("/", response_model=list[PredictionResponse])
def read_predictions(db: Session = Depends(get_db)):
    return get_predictions(db)


@router.get("/{prediction_id}", response_model=PredictionResponse)
def read_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
):
    prediction = get_prediction(db, prediction_id)

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    return prediction


@router.put("/{prediction_id}", response_model=PredictionResponse)
def update_existing_prediction(
    prediction_id: int,
    prediction: PredictionUpdate,
    db: Session = Depends(get_db),
):
    updated_prediction = update_prediction(
        db,
        prediction_id,
        prediction,
    )

    if not updated_prediction:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    return updated_prediction


@router.delete("/{prediction_id}")
def delete_existing_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
):
    deleted_prediction = delete_prediction(
        db,
        prediction_id,
    )

    if not deleted_prediction:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    return {"message": "Prediction deleted successfully"}

#Integrate AI into existing router
    
@router.post("/predict/{event_id}")
def predict_event_risk(
    event_id: int,
    db: Session = Depends(get_db),
):
    # Fetch Event
    event = get_event(db, event_id)

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    # Fetch Risk
    risk = get_risk_by_event(db, event_id)

    if not risk:
        raise HTTPException(
            status_code=404,
            detail="Risk not found for this event"
        )

    # Run AI
    result = predict_event(
        event.description,
        event.location,
    )

    # Save Prediction
    prediction = PredictionCreate(
        predicted_risk=result["category"],
        predicted_severity=result["severity"],
        confidence_score=result["confidence"],
        prediction_model="DistilBERT + XGBoost",
        prediction_status="Generated",
        risk_id=risk.id,
    )

    saved_prediction = create_prediction(
        db,
        prediction,
    )

    return {
        "message": "Prediction generated successfully",
        "prediction": saved_prediction,
    }