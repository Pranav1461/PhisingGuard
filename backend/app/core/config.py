import logging
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    PROJECT_NAME: str = "PhishGuard"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Secrets & API Keys (empty defaults - must be set via .env)
    VIRUSTOTAL_API_KEY: str = ""
    URLSCAN_API_KEY: str = ""
    URLHAUS_AUTH_KEY: str = ""

    # Email Dispatcher & Phishing Simulator (Resend or SMTP)
    RESEND_API_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SIMULATOR_SENDER_EMAIL: str = "PhishGuard Security <onboarding@resend.dev>"
    SIMULATOR_FRONTEND_URL: str = "http://localhost:5174"

    # Database (defaults to local SQLite)
    DATABASE_URL: str = "sqlite:///./phishguard.db"

    # CORS
    CORS_ORIGINS: str = "*"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == "*":
            return [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
                "http://127.0.0.1:5176",
                "http://127.0.0.1:3000",
                "https://phising-guard-beta.vercel.app"
            ]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def validate_required_keys(self) -> List[str]:
        """Validate that required API keys are configured."""
        missing = []
        if not self.VIRUSTOTAL_API_KEY or self.VIRUSTOTAL_API_KEY == "your_virustotal_api_key_here":
            missing.append("VIRUSTOTAL_API_KEY")
        if not self.URLSCAN_API_KEY or self.URLSCAN_API_KEY == "your_urlscan_api_key_here":
            missing.append("URLSCAN_API_KEY")
        if not self.URLHAUS_AUTH_KEY or self.URLHAUS_AUTH_KEY == "your_urlhaus_auth_key_here":
            missing.append("URLHAUS_AUTH_KEY")
        return missing

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Log configuration status on startup
missing_keys = settings.validate_required_keys()
if missing_keys:
    logger.warning(f"Missing API keys (some threat intel providers will be unavailable): {', '.join(missing_keys)}")
else:
    logger.info("All threat intelligence API keys configured")
