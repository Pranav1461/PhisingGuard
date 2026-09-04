from backend.app.services.risk_engine.engine import risk_engine

def test_risk_engine_safe():
    providers = {
        "virustotal": {"status": "no_match", "matched": False},
        "urlscan": {"status": "no_match", "matched": False},
        "urlhaus": {"status": "no_match", "matched": False}
    }
    features = {
        "has_ip": 0, "suspicious_keyword_count": 0, "subdomain_count": 0,
        "has_at_symbol": 0, "tld_in_path": 0, "double_slash_in_path": 0,
        "domain_entropy": 3.0, "url_length": 25, "is_https": 1
    }
    score, classification, evidence, reasons, recommendations = risk_engine.calculate_risk(
        url="https://google.com",
        domain="google.com",
        providers=providers,
        ml_prediction=0,
        ml_probability=0.05,
        features=features
    )
    assert score < 30
    assert classification == "SAFE"

def test_risk_engine_phishing():
    providers = {
        "virustotal": {"matched": True, "details": {"stats": {"malicious": 5}}},
        "urlhaus": {"matched": True},
        "urlscan": {"matched": True}
    }
    features = {
        "has_ip": 1, "suspicious_keyword_count": 3, "subdomain_count": 3,
        "has_at_symbol": 1, "tld_in_path": 1, "double_slash_in_path": 1,
        "domain_entropy": 4.8, "url_length": 120, "is_https": 0
    }
    score, classification, evidence, reasons, recommendations = risk_engine.calculate_risk(
        url="http://192.168.1.1/paypal.com@verify-account.xyz/login",
        domain="192.168.1.1",
        providers=providers,
        ml_prediction=1,
        ml_probability=0.98,
        features=features
    )
    assert score >= 65
    assert classification == "PHISHING"
    assert len(evidence) >= 3
    assert len(reasons) >= 3
