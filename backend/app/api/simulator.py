import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.database import get_db
from backend.app.schemas.simulator import (
    SimulatorSessionCreate, SimulatorSessionResponse,
    SimulatorEventCreate, SimulatorEventResponse,
    SimulatorResetResponse
)
from backend.app.models.simulator import SimulatorSession, SimulatorEvent

router = APIRouter(prefix="/simulator", tags=["Phishing Simulator"])

@router.post("/session", response_model=SimulatorSessionResponse)
async def create_simulator_session(req: SimulatorSessionCreate, db: Session = Depends(get_db)):
    session_id = f"sim-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    try:
        session = SimulatorSession(
            id=session_id,
            target_email=req.target_email,
            status="active"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to initialize simulator session.")

    return SimulatorSessionResponse(
        session_id=session_id,
        target_email=req.target_email,
        status="active",
        created_at=now.isoformat()
    )

@router.post("/events", response_model=SimulatorEventResponse)
async def create_simulator_event(req: SimulatorEventCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    event_id = str(uuid.uuid4())

    # Verify active session exists
    session = db.query(SimulatorSession).filter(SimulatorSession.id == req.session_id).first()
    if not session:
        # Auto-create fallback demo session if not initialized
        session = SimulatorSession(
            id=req.session_id,
            target_email=req.username_entered or "demo@example.test",
            status="active"
        )
        db.add(session)
        db.commit()

    try:
        event = SimulatorEvent(
            id=event_id,
            session_id=req.session_id,
            event_type=req.event_type,
            username_entered=req.username_entered,
            password_entered=req.password_entered,  # STRICT BOOLEAN ONLY!
            timestamp=now
        )
        db.add(event)
        
        if req.event_type == "login_submitted":
            session.status = "completed"
            
        db.commit()
        db.refresh(event)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to record simulator event.")

    return SimulatorEventResponse(
        id=event_id,
        session_id=req.session_id,
        event_type=req.event_type,
        username_entered=req.username_entered,
        password_entered=req.password_entered,
        password_value=req.password_value,  # Returned for educational display, NOT stored in DB
        timestamp=now.isoformat()
    )

@router.get("/events/latest")
async def get_latest_simulator_event(db: Session = Depends(get_db)):
    latest_event = db.query(SimulatorEvent).order_by(desc(SimulatorEvent.timestamp)).first()
    
    if not latest_event:
        return {
            "has_events": False,
            "message": "No active simulator events recorded yet.",
            "latest_event": None
        }

    session = db.query(SimulatorSession).filter(SimulatorSession.id == latest_event.session_id).first()

    return {
        "has_events": True,
        "latest_event": {
            "id": latest_event.id,
            "session_id": latest_event.session_id,
            "target_email": session.target_email if session else "Unknown",
            "event_type": latest_event.event_type,
            "username_entered": latest_event.username_entered,
            "password_entered": latest_event.password_entered,  # Boolean YES/NO
            "session_status": session.status if session else "completed",
            "timestamp": latest_event.timestamp.isoformat() if latest_event.timestamp else datetime.now(timezone.utc).isoformat()
        }
    }

@router.post("/reset", response_model=SimulatorResetResponse)
async def reset_simulator(db: Session = Depends(get_db)):
    try:
        db.query(SimulatorEvent).delete()
        db.query(SimulatorSession).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reset simulator database state.")

    return SimulatorResetResponse(
        status="success",
        message="Phishing simulator sessions and event history reset successfully."
    )
