import re
import math
from urllib.parse import urlparse

# Keywords frequently associated with phishing URL lures
SUSPICIOUS_KEYWORDS = [
    "login", "verify", "account", "secure", "update", "banking", 
    "paypal", "signin", "security", "admin", "confirm", "wallet", 
    "credential", "support", "auth", "validation", "service", "webmail",
    "password", "verification", "access", "recover", "notice"
]

COMMON_TLDS = [".com", ".net", ".org", ".info", ".biz", ".ru", ".cn", ".uk", ".xyz", ".top"]

def calculate_shannon_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string to measure randomness/obfuscation."""
    if not text:
        return 0.0
    prob = [float(text.count(c)) / len(text) for c in set(text)]
    return -sum(p * math.log2(p) for p in prob)

def is_ip_address(hostname: str) -> bool:
    """Check if the hostname is a raw IPv4 or IPv6 address."""
    if not hostname:
        return False
    # IPv4 regex
    ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    if re.match(ipv4_pattern, hostname):
        return True
    # IPv6 check
    if ":" in hostname or hostname.startswith("["):
        return True
    return False

def extract_url_features(url: str) -> dict:
    """
    Extract a comprehensive, deterministic feature vector from a given URL.
    Used identically during ML training and production API inference.
    """
    if not url:
        url = ""
    
    # Ensure scheme for proper parsing
    raw_url = url.strip()
    if not raw_url.startswith(("http://", "https://")):
        parsed_url = "http://" + raw_url
    else:
        parsed_url = raw_url

    try:
        parsed = urlparse(parsed_url)
        hostname = parsed.hostname or ""
        path = parsed.path or ""
        query = parsed.query or ""
        scheme = parsed.scheme or ""
    except Exception:
        hostname = ""
        path = ""
        query = ""
        scheme = ""

    url_len = len(raw_url)
    domain_len = len(hostname)
    path_len = len(path)

    # Subdomains calculation
    domain_parts = hostname.split('.')
    if len(domain_parts) > 2:
        subdomains_count = len(domain_parts) - 2
    else:
        subdomains_count = 0

    # Character counts
    dot_count = raw_url.count('.')
    hyphen_count = raw_url.count('-')
    digit_count = sum(c.isdigit() for c in raw_url)
    special_char_count = sum(not c.isalnum() and c not in ['/', ':', '.', '-', '?','=','&','%'] for c in raw_url)
    
    # Keyword detection in lowercased URL
    url_lower = raw_url.lower()
    suspicious_keyword_count = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower)

    # Specific boolean flags
    has_ip = 1 if is_ip_address(hostname) else 0
    is_https = 1 if scheme.lower() == 'https' else 0
    has_at_symbol = 1 if '@' in raw_url else 0
    is_encoded = 1 if '%' in raw_url else 0
    has_query = 1 if query else 0
    has_fragment = 1 if '#' in raw_url else 0

    # TLD in path check (e.g. example.com/paypal.com/login)
    path_lower = path.lower()
    tld_in_path = 1 if any(tld in path_lower for tld in COMMON_TLDS) else 0

    # Double slash in path check
    double_slash_in_path = 1 if '//' in path else 0

    # Entropy of domain name
    domain_entropy = round(calculate_shannon_entropy(hostname), 4)

    features = {
        "url_length": url_len,
        "domain_length": domain_len,
        "path_length": path_len,
        "dot_count": dot_count,
        "subdomain_count": subdomains_count,
        "digit_count": digit_count,
        "special_char_count": special_char_count,
        "hyphen_count": hyphen_count,
        "has_ip": has_ip,
        "is_https": is_https,
        "has_at_symbol": has_at_symbol,
        "is_encoded": is_encoded,
        "has_query": has_query,
        "has_fragment": has_fragment,
        "suspicious_keyword_count": suspicious_keyword_count,
        "tld_in_path": tld_in_path,
        "double_slash_in_path": double_slash_in_path,
        "domain_entropy": domain_entropy
    }

    return features

FEATURE_NAMES = [
    "url_length",
    "domain_length",
    "path_length",
    "dot_count",
    "subdomain_count",
    "digit_count",
    "special_char_count",
    "hyphen_count",
    "has_ip",
    "is_https",
    "has_at_symbol",
    "is_encoded",
    "has_query",
    "has_fragment",
    "suspicious_keyword_count",
    "tld_in_path",
    "double_slash_in_path",
    "domain_entropy"
]
