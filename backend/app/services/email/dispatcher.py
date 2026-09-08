"""
Email Dispatcher Service for PhishGuard Phishing Simulator.

Supports:
1. Resend API (via Async HTTP POST to https://api.resend.com/emails)
2. Custom SMTP / Gmail / Outlook (via smtplib with STARTTLS)
3. Simulated local delivery fallback when keys are not yet configured.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
import httpx

from backend.app.core.config import settings
from backend.app.services.email.templates import get_template

logger = logging.getLogger(__name__)

class EmailDispatcher:
    def __init__(self):
        self.sender_email = settings.SIMULATOR_SENDER_EMAIL or "PhishGuard Simulator <onboarding@resend.dev>"
        self.frontend_url = settings.SIMULATOR_FRONTEND_URL.rstrip("/") if settings.SIMULATOR_FRONTEND_URL else "http://localhost:5174"

    def build_simulation_url(self, session_id: str, target_email: str) -> str:
        """Constructs trackable simulation landing link."""
        import urllib.parse
        encoded_email = urllib.parse.quote(target_email)
        return f"{self.frontend_url}/simulator?session_id={session_id}&mode=login&email={encoded_email}"

    async def send_simulation_email(
        self,
        target_email: str,
        session_id: str,
        template_id: str = "nordvault-security",
        custom_subject: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches an educational phishing email to the target address.
        Attempts Resend API first, then SMTP if configured, else returns diagnostic simulated state.
        """
        template = get_template(template_id)
        sim_url = self.build_simulation_url(session_id, target_email)

        subject = custom_subject or template["subject"]
        html_content = template["generate_html"](target_email, sim_url)
        text_content = template["generate_text"](target_email, sim_url)

        # 1. Try Resend API if RESEND_API_KEY is present
        resend_key = settings.RESEND_API_KEY.strip() if settings.RESEND_API_KEY else ""
        logger.info(f"Resend key present: {bool(resend_key)}, SMTP_HOST: '{settings.SMTP_HOST}', frontend_url: {self.frontend_url}")
        if resend_key and resend_key != "your_resend_api_key_here":
            try:
                resend_result = await self._send_via_resend(
                    to_email=target_email,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content
                )
                resend_result["tracking_url"] = sim_url
                resend_result["template_id"] = template["id"]
                return resend_result
            except Exception as e:
                logger.error(f"Resend dispatch failed: {e}. Falling back to SMTP or Simulation.")

        # 2. Try SMTP if SMTP_HOST is configured
        if settings.SMTP_HOST and settings.SMTP_HOST.strip():
            try:
                smtp_result = await self._send_via_smtp(
                    to_email=target_email,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content
                )
                smtp_result["tracking_url"] = sim_url
                smtp_result["template_id"] = template["id"]
                return smtp_result
            except Exception as e:
                logger.error(f"SMTP dispatch failed: {e}")

        # 3. Fallback: Simulated Delivery (returns link & instructions for testing)
        logger.info(f"Simulator in Mock Delivery mode for {target_email}. Link generated: {sim_url}")
        return {
            "success": True,
            "provider": "simulated",
            "message_id": f"sim-{session_id}",
            "recipient": target_email,
            "subject": subject,
            "tracking_url": sim_url,
            "template_id": template["id"],
            "note": "Email dispatch simulated (no RESEND_API_KEY or SMTP credentials configured in .env). Use the tracking link to test end-to-end!"
        }

    async def _send_via_resend(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str
    ) -> Dict[str, Any]:
        """Dispatches email using Resend API."""
        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY.strip()}",
            "Content-Type": "application/json"
        }

        payload = {
            "from": self.sender_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content,
            "headers": {
                "X-Entity-Ref-ID": f"phishguard-sim-{to_email}",
                "X-PhishGuard-Educational": "true"
            }
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post("https://api.resend.com/emails", json=payload, headers=headers)

            if response.status_code in (200, 201):
                data = response.json()
                logger.info(f"Resend email dispatched successfully: {data.get('id')}")
                return {
                    "success": True,
                    "provider": "resend",
                    "message_id": data.get("id", "resend-ok"),
                    "recipient": to_email,
                    "subject": subject
                }
            else:
                error_detail = response.text
                logger.error(f"Resend API error ({response.status_code}): {error_detail}")
                raise RuntimeError(f"Resend API error: {error_detail}")

    async def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str
    ) -> Dict[str, Any]:
        """Dispatches email using SMTP."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.sender_email
        msg["To"] = to_email
        msg.add_header("X-PhishGuard-Educational", "true")

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        def _sync_send():
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(self.sender_email, [to_email], msg.as_string())

        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _sync_send)

        logger.info(f"SMTP email dispatched successfully to {to_email}")
        return {
            "success": True,
            "provider": "smtp",
            "message_id": f"smtp-{to_email}",
            "recipient": to_email,
            "subject": subject
        }

email_dispatcher = EmailDispatcher()
