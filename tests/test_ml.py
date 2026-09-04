from ml.features.url_features import extract_url_features
from backend.app.services.ml.predictor import predictor_service

def test_url_feature_extraction():
    url = "http://192.168.1.1/paypal/login.php?verify=account#ref"
    feats = extract_url_features(url)
    
    assert feats["has_ip"] == 1
    assert feats["suspicious_keyword_count"] >= 2
    assert feats["is_https"] == 0
    assert feats["has_query"] == 1
    assert feats["has_fragment"] == 1

def test_ml_predictor_inference():
    phish_url = "http://paypal-security-update.xyz/signin.php?user=verify"
    pred, prob, feats, importances = predictor_service.predict_url(phish_url)
    
    assert pred in [0, 1]
    assert 0.0 <= prob <= 1.0
    assert "url_length" in feats
    assert isinstance(importances, dict)
