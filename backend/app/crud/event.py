from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate


# --------------------------------------------------
# CREATE EVENT
# --------------------------------------------------
def create_event(db: Session, event: EventCreate) -> Event:
    db_event = Event(**event.model_dump())

    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event

    except SQLAlchemyError:
        db.rollback()
        raise


# --------------------------------------------------
# GET EVENT BY URL
# --------------------------------------------------
def get_event_by_url(db: Session, url: str):
    if not url:
        return None

    return db.query(Event).filter(Event.url == url).first()


# --------------------------------------------------
# SAVE NORMALIZED EVENT
# --------------------------------------------------
def save_normalized_event(db: Session, event_data: dict) -> Event:
    """
    Save a normalized event only if it doesn't already exist.
    """

    existing_event = get_event_by_url(db, event_data.get("url"))

    if existing_event:
        return existing_event

    db_event = Event(**event_data)

    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event

    except SQLAlchemyError:
        db.rollback()
        raise


# --------------------------------------------------
# GET SINGLE EVENT
# --------------------------------------------------
def get_event(db: Session, event_id: int):
    return db.query(Event).filter(Event.id == event_id).first()


# --------------------------------------------------
# GET ALL EVENTS
# --------------------------------------------------
def get_events(db: Session):
    return db.query(Event).all()


# --------------------------------------------------
# UPDATE EVENT
# --------------------------------------------------
def update_event(
    db: Session,
    event_id: int,
    event: EventUpdate
):
    db_event = get_event(db, event_id)

    if not db_event:
        return None

    update_data = event.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_event, key, value)

    try:
        db.commit()
        db.refresh(db_event)
        return db_event

    except SQLAlchemyError:
        db.rollback()
        raise


# --------------------------------------------------
# DELETE EVENT
# --------------------------------------------------
def delete_event(
    db: Session,
    event_id: int
):
    db_event = get_event(db, event_id)

    if not db_event:
        return None

    try:
        db.delete(db_event)
        db.commit()
        return db_event

    except SQLAlchemyError:
        db.rollback()
        raise