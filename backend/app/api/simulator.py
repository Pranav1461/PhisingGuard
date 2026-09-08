import uuid
import logging
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.database import get_db
from backend.app.schemas.simulator import (
    SimulatorTemplateItem,
    EmailDispatchCreate, EmailDispatchResponse,
    SimulatorSessionCreate, SimulatorSessionResponse,
    SimulatorSessionDetailResponse, SimulatorEventItem,
    SimulatorEventCreate, SimulatorEventResponse,
    SimulatorResetResponse,
    CredentialCaptureRequest, CredentialCaptureResponse
)
from backend.app.models.simulator import SimulatorSession, SimulatorEvent
from backend.app.services.email.dispatcher import email_dispatcher
from backend.app.services.email.templates import list_templates, get_template

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simulator", tags=["Phishing Simulator"])

@router.get("/templates", response_model=List[SimulatorTemplateItem])
async def get_simulator_templates():
    """Retrieve available educational phishing email scenarios and templates."""
    return list_templates()

@router.post("/send-email", response_model=EmailDispatchResponse)
async def dispatch_simulation_email(
    req: EmailDispatchCreate,
    db: Session = Depends(get_db)
):
    """
    Dispatch an educational simulation email to a target address (Resend API or SMTP)
    and create a tracking session.
    """
    if not req.target_email or "@" not in req.target_email:
        raise HTTPException(status_code=400, detail="A valid target email address is required.")

    session_id = f"sim-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)

    # 1. Create session record
    try:
        session = SimulatorSession(
            id=session_id,
            target_email=req.target_email,
            template_id=req.template_id,
            status="sent",
            created_at=now,
            updated_at=now
        )
        db.add(session)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create database session: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize simulator tracking session.")

    # 2. Dispatch the email
    try:
        dispatch_result = await email_dispatcher.send_simulation_email(
            target_email=req.target_email,
            session_id=session_id,
            template_id=req.template_id,
            custom_subject=req.custom_subject
        )
    except Exception as e:
        logger.error(f"Email dispatch error: {e}")
        dispatch_result = {
            "success": False,
            "provider": "failed",
            "message_id": "error",
            "recipient": req.target_email,
            "subject": req.custom_subject or "PhishGuard Simulation",
            "tracking_url": email_dispatcher.build_simulation_url(session_id, req.target_email),
            "template_id": req.template_id,
            "error": str(e)
        }

    # 3. Record email_sent event
    try:
        event = SimulatorEvent(
            id=str(uuid.uuid4()),
            session_id=session_id,
            event_type="email_sent",
            username_entered=None,
            password_entered=False,
            timestamp=now
        )
        db.add(event)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"Could not record email_sent event: {e}")

    provider_name = dispatch_result.get("provider", "simulated")
    msg = (
        f"Educational phishing email dispatched via {provider_name.upper()} to {req.target_email}."
        if dispatch_result.get("success")
        else f"Email dispatch failed ({dispatch_result.get('error')}), but tracking session is active."
    )

    return EmailDispatchResponse(
        success=dispatch_result.get("success", False),
        provider=provider_name,
        session_id=session_id,
        target_email=req.target_email,
        template_id=req.template_id,
        tracking_url=dispatch_result.get("tracking_url", email_dispatcher.build_simulation_url(session_id, req.target_email)),
        message=msg
    )

@router.post("/session", response_model=SimulatorSessionResponse)
async def create_simulator_session(req: SimulatorSessionCreate, db: Session = Depends(get_db)):
    """Initialize a simulator session manually without sending an email."""
    session_id = f"sim-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)

    try:
        session = SimulatorSession(
            id=session_id,
            target_email=req.target_email,
            template_id=req.template_id or "nordvault-security",
            status="active",
            created_at=now,
            updated_at=now
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
        template_id=session.template_id,
        status="active",
        created_at=now.isoformat()
    )

@router.post("/events", response_model=SimulatorEventResponse)
async def create_simulator_event(
    req: SimulatorEventCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Log an interaction event (link_clicked, login_submitted) for a simulation session.
    """
    now = datetime.now(timezone.utc)
    event_id = str(uuid.uuid4())

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Verify active session exists
    session = db.query(SimulatorSession).filter(SimulatorSession.id == req.session_id).first()
    if not session:
        # Auto-create fallback demo session if opened directly
        session = SimulatorSession(
            id=req.session_id,
            target_email=req.username_entered or "demo@example.test",
            template_id="nordvault-security",
            status="active",
            created_at=now,
            updated_at=now
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
            password_value=req.password_value,  # Persist for educational display in monitor
            user_agent=user_agent,
            ip_address=client_ip,
            timestamp=now
        )
        db.add(event)

        # Update session status
        if req.event_type == "link_clicked":
            session.status = "clicked"
        elif req.event_type == "login_submitted":
            session.status = "submitted"

        session.updated_at = now
        db.commit()
        db.refresh(event)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record event: {e}")
        raise HTTPException(status_code=500, detail="Failed to record simulator event.")

    return SimulatorEventResponse(
        id=event_id,
        session_id=req.session_id,
        event_type=req.event_type,
        username_entered=req.username_entered,
        password_entered=req.password_entered,
        password_value=req.password_value,  # Returned for educational display only, NOT stored in DB
        timestamp=now.isoformat()
    )

@router.get("/sessions", response_model=List[SimulatorSessionDetailResponse])
async def list_simulator_sessions(db: Session = Depends(get_db)):
    """Retrieve history of all simulator sessions with their full event timeline."""
    sessions = db.query(SimulatorSession).order_by(desc(SimulatorSession.created_at)).limit(50).all()

    result = []
    for s in sessions:
        events = [
            SimulatorEventItem(
                id=ev.id,
                session_id=ev.session_id,
                event_type=ev.event_type,
                username_entered=ev.username_entered,
                password_entered=ev.password_entered,
                timestamp=ev.timestamp.isoformat() if ev.timestamp else datetime.now(timezone.utc).isoformat()
            )
            for ev in s.events
        ]
        result.append(
            SimulatorSessionDetailResponse(
                session_id=s.id,
                target_email=s.target_email,
                template_id=s.template_id,
                status=s.status,
                created_at=s.created_at.isoformat() if s.created_at else datetime.now(timezone.utc).isoformat(),
                updated_at=s.updated_at.isoformat() if s.updated_at else None,
                events=events
            )
        )
    return result

@router.get("/sessions/{session_id}", response_model=SimulatorSessionDetailResponse)
async def get_simulator_session_detail(session_id: str, db: Session = Depends(get_db)):
    """Retrieve details and event stream for a specific session ID."""
    session = db.query(SimulatorSession).filter(SimulatorSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Simulator session not found.")

    events = [
        SimulatorEventItem(
            id=ev.id,
            session_id=ev.session_id,
            event_type=ev.event_type,
            username_entered=ev.username_entered,
            password_entered=ev.password_entered,
            timestamp=ev.timestamp.isoformat() if ev.timestamp else datetime.now(timezone.utc).isoformat()
        )
        for ev in session.events
    ]

    return SimulatorSessionDetailResponse(
        session_id=session.id,
        target_email=session.target_email,
        template_id=session.template_id,
        status=session.status,
        created_at=session.created_at.isoformat() if session.created_at else datetime.now(timezone.utc).isoformat(),
        updated_at=session.updated_at.isoformat() if session.updated_at else None,
        events=events
    )

@router.get("/events/latest")
async def get_latest_simulator_event(db: Session = Depends(get_db)):
    """Get the most recent event across all simulation sessions for the live monitoring widget."""
    latest_event = db.query(SimulatorEvent).order_by(desc(SimulatorEvent.timestamp)).first()

    if not latest_event:
        return {
            "has_events": False,
            "message": "No active simulator events recorded yet.",
            "latest_event": None,
            "active_sessions_count": 0
        }

    session = db.query(SimulatorSession).filter(SimulatorSession.id == latest_event.session_id).first()
    active_count = db.query(SimulatorSession).filter(SimulatorSession.status.in_(["sent", "clicked", "active"])).count()

    return {
        "has_events": True,
        "active_sessions_count": active_count,
        "latest_event": {
            "id": latest_event.id,
            "session_id": latest_event.session_id,
            "target_email": session.target_email if session else "Unknown",
            "template_id": session.template_id if session else "nordvault-security",
            "event_type": latest_event.event_type,
            "username_entered": latest_event.username_entered,
            "password_entered": latest_event.password_entered,  # Boolean YES/NO
            "password_value": latest_event.password_value if latest_event.password_entered else None,  # Educational display
            "session_status": session.status if session else "completed",
            "timestamp": latest_event.timestamp.isoformat() if latest_event.timestamp else datetime.now(timezone.utc).isoformat()
        }
    }

@router.post("/reset", response_model=SimulatorResetResponse)
async def reset_simulator(db: Session = Depends(get_db)):
    """Reset all simulator sessions and interaction logs."""
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

@router.post("/capture-credentials", response_model=CredentialCaptureResponse)
async def capture_credentials(
    req: CredentialCaptureRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    EDUCATIONAL ONLY: Capture credentials from fake login page.
    This endpoint demonstrates how phishing attacks capture data in real-time.
    Password is stored temporarily for educational display in the monitor.
    """
    now = datetime.now(timezone.utc)
    event_id = str(uuid.uuid4())

    client_ip = request.client.host if request.client else None
    user_agent = req.user_agent or request.headers.get("user-agent")

    # Verify session exists
    session = db.query(SimulatorSession).filter(SimulatorSession.id == req.session_id).first()
    if not session:
        # Auto-create fallback session if opened directly
        session = SimulatorSession(
            id=req.session_id,
            target_email=req.username,
            template_id="nordvault-security",
            status="active",
            created_at=now,
            updated_at=now
        )
        db.add(session)
        db.commit()

    try:
        # Store credential capture event WITH the actual password for educational display
        event = SimulatorEvent(
            id=event_id,
            session_id=req.session_id,
            event_type="login_submitted",
            username_entered=req.username,
            password_entered=bool(req.password),
            password_value=req.password,  # Store for educational display in monitor
            user_agent=user_agent,
            ip_address=client_ip,
            timestamp=now
        )
        db.add(event)

        # Update session to "submitted" status
        session.status = "submitted"
        session.updated_at = now
        db.commit()
        db.refresh(event)

        logger.info(f"[EDUCATIONAL CAPTURE] Session {req.session_id}: username={req.username}, password={req.password}")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to capture credentials: {e}")
        raise HTTPException(status_code=500, detail="Failed to record credential capture event.")

    return CredentialCaptureResponse(
        success=True,
        session_id=req.session_id,
        message="Credentials captured successfully (educational demonstration)",
        captured_username=req.username,
        captured_password_length=len(req.password),
        timestamp=now.isoformat()
    )
