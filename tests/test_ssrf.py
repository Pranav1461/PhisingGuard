import pytest
from backend.app.core.security import normalize_url, validate_ssrf_safety

def test_normalize_url_valid():
    assert normalize_url("example.com") == "http://example.com"
    assert normalize_url("https://Google.com/path?q=1") == "https://google.com/path?q=1"

def test_ssrf_safety_allowed():
    assert validate_ssrf_safety("https://google.com") == True
    assert validate_ssrf_safety("https://virustotal.com/api") == True

def test_ssrf_safety_blocked_loopback():
    with pytest.raises(ValueError, match="blocked"):
        validate_ssrf_safety("http://localhost:8000")
    with pytest.raises(ValueError, match="blocked"):
        validate_ssrf_safety("http://127.0.0.1/admin")

def test_ssrf_safety_blocked_private_ip():
    with pytest.raises(ValueError, match="blocked"):
        validate_ssrf_safety("http://192.168.1.1/router")
    with pytest.raises(ValueError, match="blocked"):
        validate_ssrf_safety("http://10.0.0.5/internal")

def test_ssrf_safety_blocked_invalid_scheme():
    with pytest.raises(ValueError, match="Unsupported protocol"):
        validate_ssrf_safety("ftp://example.com/file.txt")
