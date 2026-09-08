import httpx
from typing import Dict, Any
from backend.app.core.config import settings
from backend.app.services.threat_intel.base import BaseThreatIntelProvider

class UrlhausProvider(BaseThreatIntelProvider):
    def __init__(self):
        super().__init__("urlhaus")
        self.api_key = settings.URLHAUS_AUTH_KEY.strip()
        self.base_url = "https://urlhaus-api.abuse.ch/v1"

    async def check_url(self, url: str, domain: str) -> Dict[str, Any]:
        headers = {}
        if self.api_key:
            headers["Auth-Key"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{self.base_url}/url/",
                    data={"url": url},
                    headers=headers
                )

                if res.status_code == 429:
                    return {
                        "provider": self.name,
                        "status": "rate_limited",
                        "matched": False,
                        "severity": None,
                        "message": "URLhaus rate limit reached.",
                        "details": None
                    }

                if res.status_code != 200:
                    return {
                        "provider": self.name,
                        "status": "error",
                        "matched": False,
                        "severity": None,
                        "message": f"URLhaus API returned HTTP {res.status_code}.",
                        "details": None
                    }

                data = res.json()
                query_status = data.get("query_status")

                if query_status == "no_results" or query_status == "ok" and not data.get("url_status"):
                    return {
                        "provider": self.name,
                        "status": "no_match",
                        "matched": False,
                        "severity": "low",
                        "message": "URLhaus database: No malware distribution match found.",
                        "details": {"query_status": query_status}
                    }

                if query_status == "ok":
                    url_status = data.get("url_status", "online")
                    threat = data.get("threat", "malware_download")
                    tags = data.get("tags", [])

                    return {
                        "provider": self.name,
                        "status": "success",
                        "matched": True,
                        "severity": "high" if url_status == "online" else "medium",
                        "message": f"URLhaus alert: Flagged malware/phishing distribution site (Status: {url_status}, Threat: {threat}).",
                        "details": {
                            "url_status": url_status,
                            "threat": threat,
                            "tags": tags,
                            "reporter": data.get("reporter")
                        }
                    }

                return {
                    "provider": self.name,
                    "status": "no_match",
                    "matched": False,
                    "severity": "low",
                    "message": f"URLhaus status: {query_status}",
                    "details": None
                }

        except httpx.TimeoutException:
            return {
                "provider": self.name,
                "status": "unavailable",
                "matched": False,
                "severity": None,
                "message": "URLhaus request timed out (5.0s limit).",
                "details": None
            }
        except Exception as e:
            return {
                "provider": self.name,
                "status": "error",
                "matched": False,
                "severity": None,
                "message": f"URLhaus error: {str(e)}",
                "details": None
            }
