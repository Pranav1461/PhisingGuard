import httpx
from typing import Dict, Any
from backend.app.core.config import settings
from backend.app.services.threat_intel.base import BaseThreatIntelProvider

class UrlscanProvider(BaseThreatIntelProvider):
    def __init__(self):
        super().__init__("urlscan")
        self.api_key = settings.URLSCAN_API_KEY.strip()
        self.base_url = "https://urlscan.io/api/v1"

    async def check_url(self, url: str, domain: str) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "provider": self.name,
                "status": "unavailable",
                "matched": False,
                "severity": None,
                "message": "urlscan.io API key not configured.",
                "details": None
            }

        headers = {
            "API-Key": self.api_key,
            "Content-Type": "application/json"
        }

        try:
            # Query existing domain scan results to avoid consuming scan quota
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{self.base_url}/search/?q=domain:\"{domain}\"",
                    headers=headers
                )

                if res.status_code == 429:
                    return {
                        "provider": self.name,
                        "status": "rate_limited",
                        "matched": False,
                        "severity": None,
                        "message": "urlscan.io rate limit reached.",
                        "details": None
                    }

                if res.status_code != 200:
                    return {
                        "provider": self.name,
                        "status": "error",
                        "matched": False,
                        "severity": None,
                        "message": f"urlscan.io returned status {res.status_code}.",
                        "details": None
                    }

                data = res.json()
                results = data.get("results", [])

                if not results:
                    return {
                        "provider": self.name,
                        "status": "no_match",
                        "matched": False,
                        "severity": "low",
                        "message": "No historical malicious scan matches found on urlscan.io.",
                        "details": {"total_scans_checked": 0}
                    }

                # Check recent scan verdicts
                malicious_scans = [r for r in results if r.get("verdicts", {}).get("overall", {}).get("malicious", False)]
                matched = len(malicious_scans) > 0
                
                return {
                    "provider": self.name,
                    "status": "success",
                    "matched": matched,
                    "severity": "high" if matched else "low",
                    "message": f"urlscan.io matched {len(malicious_scans)} malicious scan(s) out of {len(results)} domain records.",
                    "details": {
                        "total_scans": len(results),
                        "malicious_scans": len(malicious_scans),
                        "latest_scan_url": results[0].get("result") if results else None
                    }
                }

        except httpx.TimeoutException:
            return {
                "provider": self.name,
                "status": "unavailable",
                "matched": False,
                "severity": None,
                "message": "urlscan.io request timed out (5.0s limit).",
                "details": None
            }
        except Exception as e:
            return {
                "provider": self.name,
                "status": "error",
                "matched": False,
                "severity": None,
                "message": f"urlscan.io error: {str(e)}",
                "details": None
            }
