import asyncio
from typing import Dict, Any
from backend.app.services.threat_intel.virustotal import VirusTotalProvider
from backend.app.services.threat_intel.urlscan import UrlscanProvider
from backend.app.services.threat_intel.urlhaus import UrlhausProvider

class ThreatIntelligenceService:
    def __init__(self):
        self.providers = [
            VirusTotalProvider(),
            UrlscanProvider(),
            UrlhausProvider()
        ]

    async def query_all(self, url: str, domain: str) -> Dict[str, Dict[str, Any]]:
        """
        Query all threat intelligence providers concurrently.
        If a provider fails or errors, it returns an independent unavailable/error payload
        without failing the overall analysis.
        """
        tasks = [provider.check_url(url, domain) for provider in self.providers]
        try:
            # Add an overall timeout of 10 seconds to avoid hanging the request
            results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=10.0)
        except asyncio.TimeoutError:
            results = [TimeoutError("Provider timed out")] * len(self.providers)

        provider_map = {}
        for provider, res in zip(self.providers, results):
            if isinstance(res, (Exception, TimeoutError)):
                provider_map[provider.name] = {
                    "provider": provider.name,
                    "status": "error",
                    "matched": False,
                    "severity": None,
                    "message": f"Unhandled provider exception: {str(res)}",
                    "details": None
                }
            else:
                provider_map[provider.name] = res

        return provider_map
