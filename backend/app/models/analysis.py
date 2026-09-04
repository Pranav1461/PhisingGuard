import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    raw_url = Column(Text, nullable=False)
    normalized_url = Column(Text, nullable=False)
    domain = Column(String(255), nullable=False, index=True)
    risk_score = Column(Integer, nullable=False)
    classification = Column(String(20), nullable=False)  # SAFE, SUSPICIOUS, PHISHING
    ml_probability = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    threat_intel_records = relationship("ThreatIntelRecord", back_populates="analysis", cascade="all, delete-orphan")

class ThreatIntelRecord(Base):
    __tablename__ = "threat_intel_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String(36), ForeignKey("analysis_history.id"), nullable=False)
    provider = Column(String(50), nullable=False)  # virustotal, urlscan, urlhaus
    status = Column(String(20), nullable=False)    # success, no_match, unavailable, rate_limited, error
    matched = Column(Boolean, default=False)
    severity = Column(String(20), nullable=True)   # low, medium, high, critical
    raw_details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    analysis = relationship("AnalysisHistory", back_populates="threat_intel_records")
