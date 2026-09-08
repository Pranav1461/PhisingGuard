import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class SimulatorSession(Base):
    __tablename__ = "simulator_sessions"

    id = Column(String(64), primary_key=True)  # e.g. "sim-12345678"
    target_email = Column(String(255), nullable=False)
    template_id = Column(String(50), nullable=True, default="nordvault-security")
    status = Column(String(20), nullable=False, default="sent")  # sent, opened, clicked, submitted, completed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    events = relationship("SimulatorEvent", back_populates="session", cascade="all, delete-orphan", order_by="SimulatorEvent.timestamp")

class SimulatorEvent(Base):
    __tablename__ = "simulator_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(64), ForeignKey("simulator_sessions.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # email_sent, email_opened, link_clicked, login_submitted
    username_entered = Column(String(255), nullable=True)
    password_entered = Column(Boolean, nullable=False, default=False)  # CRITICAL: STRICT BOOLEAN ONLY!
    password_value = Column(String(255), nullable=True)  # EDUCATIONAL ONLY: Captured password for demo display
    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session = relationship("SimulatorSession", back_populates="events")
