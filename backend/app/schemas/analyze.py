from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class AnalyzeURLRequest(BaseModel):
    url: str = Field(..., description="The suspicious URL to analyze", json_schema_extra={"example": "https://suspicious-paypal-verify.xyz/login"})

class ProviderStatus(BaseModel):
    provider: str
    status: str  # success, no_match, unavailable, rate_limited, error
    matched: bool = False
    severity: Optional[str] = None
    message: str
    details: Optional[Dict[str, Any]] = None

class EvidenceItem(BaseModel):
    title: str
    category: str
    description: str
    risk_level: str  # low, medium, high, critical

class AnalyzeURLResponse(BaseModel):
    id: str
    url: str
    normalized_url: str
    domain: str
    classification: str  # SAFE, SUSPICIOUS, PHISHING
    risk_score: int      # 0 to 100
    ml_probability: float # 0.0 to 1.0
    providers: Dict[str, ProviderStatus]
    evidence: List[EvidenceItem]
    reasons: List[str]
    recommendations: List[str]
    url_features: Dict[str, Any]
    analyzed_at: str
