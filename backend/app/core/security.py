import socket
import ipaddress
from urllib.parse import urlparse, urlunparse

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10")
]

BLOCKED_HOSTNAMES = {
    "localhost", "loopback", "internal", "local", "invalid", "test"
}

def normalize_url(raw_url: str) -> str:
    """Normalize input URL for safe analysis."""
    if not raw_url:
        raise ValueError("URL cannot be empty.")
    
    url = raw_url.strip()
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
        
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()
    path = parsed.path
    query = parsed.query
    fragment = parsed.fragment
    
    if not netloc:
        raise ValueError("Invalid URL: missing domain or host.")
        
    normalized = urlunparse((scheme, netloc, path, parsed.params, query, fragment))
    return normalized

def validate_ssrf_safety(url: str) -> bool:
    """
    Strict SSRF validation. 
    Verifies scheme and resolves target IP against private/loopback ranges.
    Returns True if safe, raises ValueError if dangerous.
    """
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    
    if scheme not in ["http", "https"]:
        raise ValueError(f"Unsupported protocol scheme: '{scheme}'. Only HTTP and HTTPS are permitted.")
        
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Invalid URL hostname.")
        
    if hostname.lower() in BLOCKED_HOSTNAMES or hostname.endswith(".local"):
        raise ValueError(f"Access to internal host '{hostname}' is blocked for security reasons (SSRF Protection).")

    # Resolve IP address
    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        # Unable to resolve hostname - safe to pass to external threat APIs (they handle unknown domains)
        return True

    for family, socktype, proto, canonname, sockaddr in addr_info:
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            for blocked_net in BLOCKED_IP_NETWORKS:
                if ip_obj in blocked_net:
                    raise ValueError(f"Destination IP '{ip_str}' belongs to a private/loopback network. Access blocked (SSRF Protection).")
        except ValueError as ve:
            if "blocked" in str(ve):
                raise ve
            pass

    return True
