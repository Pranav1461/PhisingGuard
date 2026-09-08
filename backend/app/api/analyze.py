import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import normalize_url, validate_ssrf_safety
from backend.app.schemas.analyze import AnalyzeURLRequest, AnalyzeURLResponse, ProviderStatus, EvidenceItem
from backend.app.services.threat_intel.orchestrator import ThreatIntelligenceService
from backend.app.services.ml.predictor import predictor_service
from backend.app.services.risk_engine.engine import risk_engine
from backend.app.models.analysis import AnalysisHistory, ThreatIntelRecord

router = APIRouter(tags=["URL Analysis"])
threat_intel_service = ThreatIntelligenceService()

@router.post("/analyze-url", response_model=AnalyzeURLResponse)
@router.post("/analyze", response_model=AnalyzeURLResponse)
async def analyze_url(req: AnalyzeURLRequest, db: Session = Depends(get_db)):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please provide a valid URL to analyze.")

    # 1. Normalize & Validate URL
    try:
        normalized_url = normalize_url(req.url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # 2. SSRF Protection check
    try:
        validate_ssrf_safety(normalized_url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    parsed = urlparse(normalized_url)
    domain = parsed.hostname or ""

    # 3. Query Threat Intelligence Providers (Concurrent, Fail-Open)
    providers_result = await threat_intel_service.query_all(normalized_url, domain)

    # 4. Run ML Model Prediction
    ml_pred, ml_prob, features, feature_importances = predictor_service.predict_url(normalized_url)

    # 5. Run Explainable Risk Engine
    risk_score, classification, evidence_items, reasons, recommendations = risk_engine.calculate_risk(
        url=normalized_url,
        domain=domain,
        providers=providers_result,
        ml_prediction=ml_pred,
        ml_probability=ml_prob,
        features=features
    )

    # 6. Build response provider objects
    provider_responses = {}
    for p_name, p_data in providers_result.items():
        provider_responses[p_name] = ProviderStatus(
            provider=p_name,
            status=p_data.get("status", "unavailable"),
            matched=p_data.get("matched", False),
            severity=p_data.get("severity"),
            message=p_data.get("message", "No status message."),
            details=p_data.get("details")
        )

    evidence_models = [EvidenceItem(**item) for item in evidence_items]
    analysis_id = str(uuid.uuid4())
    analyzed_at_str = datetime.now(timezone.utc).isoformat()

    # 7. Persist to Database if available
    try:
        db_history = AnalysisHistory(
            id=analysis_id,
            raw_url=req.url,
            normalized_url=normalized_url,
            domain=domain,
            risk_score=risk_score,
            classification=classification,
            ml_probability=ml_prob
        )
        db.add(db_history)

        for p_name, p_data in providers_result.items():
            db_record = ThreatIntelRecord(
                id=str(uuid.uuid4()),
                analysis_id=analysis_id,
                provider=p_name,
                status=p_data.get("status", "unavailable"),
                matched=p_data.get("matched", False),
                severity=p_data.get("severity"),
                raw_details=p_data.get("details")
            )
            db.add(db_record)

        db.commit()
    except Exception as e:
        db.rollback()
        # Database failure should not block returning analysis result to user
        pass

    return AnalyzeURLResponse(
        id=analysis_id,
        url=req.url,
        normalized_url=normalized_url,
        domain=domain,
        classification=classification,
        risk_score=risk_score,
        ml_probability=ml_prob,
        providers=provider_responses,
        evidence=evidence_models,
        reasons=reasons,
        recommendations=recommendations,
        url_features=features,
        analyzed_at=analyzed_at_str
    )
