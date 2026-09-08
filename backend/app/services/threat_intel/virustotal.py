import base64
import httpx
from typing import Dict, Any
from backend.app.core.config import settings
from backend.app.services.threat_intel.base import BaseThreatIntelProvider

class VirusTotalProvider(BaseThreatIntelProvider):
    def __init__(self):
        super().__init__("virustotal")
        self.api_key = settings.VIRUSTOTAL_API_KEY.strip()
        self.base_url = "https://www.virustotal.com/api/v3"

    async def check_url(self, url: str, domain: str) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "provider": self.name,
                "status": "unavailable",
                "matched": False,
                "severity": None,
                "message": "VirusTotal API key not configured.",
                "details": None
            }

        # VT v3 URL ID format: url without padding base64 encoded
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")

        headers = {
            "x-apikey": self.api_key,
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/urls/{url_id}", headers=headers)
                
                if res.status_code == 429:
                    return {
                        "provider": self.name,
                        "status": "rate_limited",
                        "matched": False,
                        "severity": None,
                        "message": "VirusTotal rate limit exceeded (500 req/day, 4 req/min limit).",
                        "details": None
                    }

                if res.status_code == 404:
                    return {
                        "provider": self.name,
                        "status": "no_match",
                        "matched": False,
                        "severity": "low",
                        "message": "No threat records found in VirusTotal database for this URL.",
                        "details": {"stats": {"malicious": 0, "suspicious": 0, "harmless": 0}}
                    }

                if res.status_code != 200:
                    return {
                        "provider": self.name,
                        "status": "error",
                        "matched": False,
                        "severity": None,
                        "message": f"VirusTotal returned unexpected status code {res.status_code}.",
                        "details": None
                    }

                data = res.json()
                attributes = data.get("data", {}).get("attributes", {})
                last_analysis_stats = attributes.get("last_analysis_stats", {})
                
                malicious = last_analysis_stats.get("malicious", 0)
                suspicious = last_analysis_stats.get("suspicious", 0)
                harmless = last_analysis_stats.get("harmless", 0)
                undetected = last_analysis_stats.get("undetected", 0)

                matched = (malicious + suspicious) > 0
                severity = "critical" if malicious >= 5 else ("high" if malicious >= 2 else ("medium" if matched else "low"))

                return {
                    "provider": self.name,
                    "status": "success",
                    "matched": matched,
                    "severity": severity if matched else "low",
                    "message": f"VirusTotal detection: {malicious} malicious engine(s), {suspicious} suspicious engine(s).",
                    "details": {
                        "stats": {
                            "malicious": malicious,
                            "suspicious": suspicious,
                            "harmless": harmless,
                            "undetected": undetected
                        },
                        "scan_date": attributes.get("date")
                    }
                }

        except httpx.TimeoutException:
            return {
                "provider": self.name,
                "status": "unavailable",
                "matched": False,
                "severity": None,
                "message": "VirusTotal API request timed out (5.0s limit).",
                "details": None
            }
        except Exception as e:
            return {
                "provider": self.name,
                "status": "error",
                "matched": False,
                "severity": None,
                "message": f"VirusTotal error: {str(e)}",
                "details": None
            }
