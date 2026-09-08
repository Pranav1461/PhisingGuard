from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseThreatIntelProvider(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def check_url(self, url: str, domain: str) -> Dict[str, Any]:
        """
        Check URL against external threat intelligence provider.
        Returns standardized dict:
        {
            "provider": str,
            "status": "success" | "no_match" | "unavailable" | "rate_limited" | "error",
            "matched": bool,
            "severity": "low" | "medium" | "high" | "critical" | None,
            "message": str,
            "details": dict | None
        }
        """
        pass
