import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PhishGuard"

def test_analyze_url_success():
    payload = {"url": "https://google.com"}
    res = client.post("/api/analyze-url", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "classification" in data
    assert "risk_score" in data
    assert "providers" in data
    assert "virustotal" in data["providers"]
    assert "urlscan" in data["providers"]
    assert "urlhaus" in data["providers"]

def test_analyze_url_ssrf_blocked():
    payload = {"url": "http://127.0.0.1:8000/secret"}
    res = client.post("/api/analyze-url", json=payload)
    assert res.status_code == 400
    assert "SSRF Protection" in res.json()["detail"]
