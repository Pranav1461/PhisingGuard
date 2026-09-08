"""
Educational Phishing Email Templates for PhishGuard.

These templates represent standard social engineering attack vectors (Urgency, Authority, Fear of Loss)
for security awareness training and educational testing.
All templates contain mandatory academic/educational disclaimer footers.
"""

from typing import Dict, Any, List

TEMPLATES: Dict[str, Dict[str, Any]] = {
    "nordvault-security": {
        "id": "nordvault-security",
        "name": "NordVault Security Alert (Mailbox Lock)",
        "category": "Security / Urgency",
        "difficulty": "Medium",
        "subject": "🚨 PHISHING AWARENESS TEST - DO NOT CLICK OR ENTER CREDENTIALS - EDUCATIONAL ONLY",
        "sender_name": "NordVault Security Team",
        "sender_email_display": "security-alerts@nordvault-mail.nfo",
        "lure_description": "Simulates an urgent account security alert claiming your mailbox will be locked in 24 hours.",
        "generate_html": lambda target_email, sim_url: f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Action Required: Unusual Sign-in Detected</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
    <!-- 🚨 CRITICAL EDUCATIONAL DISCLAIMER BANNER -->
    <div style="background-color: #7f1d1d; border-bottom: 3px solid #ef4444; padding: 14px 20px; text-align: center; font-size: 13px; color: #fecaca;">
        <span style="font-size: 16px;">🚨</span> <strong style="color: #fca5a5;">SECURITY AWARENESS TEST — EDUCATIONAL PURPOSE ONLY</strong><br>
        <span style="color: #fecaca; font-size: 11px;">Do NOT click this link. Do NOT enter any passwords. This is a simulated phishing attack for training.</span>
    </div>

    <!-- Email Content Card -->
    <div style="max-width: 580px; margin: 30px auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <div style="padding: 24px 32px; background: linear-gradient(180deg, #1e293b 0%, #111827 100%); border-bottom: 1px solid #1f2937;">
            <div style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 14px; padding: 6px 12px; border-radius: 6px; letter-spacing: 0.5px;">
                NordVault Mail
            </div>
            <h1 style="margin: 16px 0 0 0; font-size: 20px; font-weight: 700; color: #f8fafc;">
                Suspicious Activity Detected
            </h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong style="color: #f8fafc;">{target_email}</strong>,
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Our automated threat detection systems blocked an unrecognized sign-in attempt to your NordVault mailbox from an untrusted device (IP: 185.220.101.5 - Frankfurt, DE).
            </p>

            <div style="background-color: #1e1b4b; border-left: 4px solid #6366f1; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #e0e7ff; line-height: 1.5;">
                    ⚠️ <strong>Urgent:</strong> Your mailbox will be temporarily suspended in <strong>24 hours</strong> unless you verify your identity to confirm you initiated this session.
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="{sim_url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; padding: 14px 32px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);">
                    Verify Mailbox & Keep Access &rarr;
                </a>
            </div>

            <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; text-align: center;">
                If the button above does not work, copy and paste this link into your browser:
            </p>
            <p style="margin: 0 0 24px 0; font-size: 11px; color: #38bdf8; word-break: break-all; text-align: center; font-family: monospace;">
                {sim_url}
            </p>

            <hr style="border: 0; border-top: 1px solid #1f2937; margin: 24px 0;">

            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                NordVault Security Team &bull; 100 Secure Way, Suite 400 &bull; Automated System Notice
            </p>
        </div>

        <!-- Educational Disclaimer Footer -->
        <div style="background-color: #7f1d1d; padding: 20px 32px; border-top: 3px solid #ef4444; font-size: 12px; color: #fecaca; line-height: 1.6;">
            <strong style="color: #fca5a5; font-size: 14px;">🎓 EDUCATIONAL SECURITY AWARENESS TEST</strong><br><br>
            <strong style="color: #ffffff;">DO NOT CLICK THE LINK ABOVE. DO NOT ENTER ANY PASSWORDS.</strong><br><br>
            This email is a simulated phishing attack created by <strong>PhishGuard</strong> for cybersecurity education purposes only.
            If you click the link and enter credentials, they will be captured in real-time to demonstrate how phishing attacks work.
            <br><br>
            <strong>Never enter real passwords on suspicious links.</strong> This simulation shows how attackers steal information through social engineering.
        </div>
    </div>
</body>
</html>""",
        "generate_text": lambda target_email, sim_url: f"""[PhishGuard Educational Simulation]
=========================================
NordVault Security Team - Suspicious Activity Notice

Hello {target_email},

We detected an unrecognized sign-in attempt to your NordVault mailbox.
Your mailbox access will be suspended within 24 hours unless you confirm your identity.

Please verify your account immediately at:
{sim_url}

---
ACADEMIC NOTICE: This is an educational security awareness simulation generated by PhishGuard. Do not enter real credentials.
"""
    },

    "storage-quota": {
        "id": "storage-quota",
        "name": "Cloud Storage Full (Fear of Loss)",
        "category": "Infrastructure / Fear of Loss",
        "difficulty": "Easy",
        "subject": "⚠️ EDUCATIONAL SECURITY TEST - DO NOT CLICK: Storage Alert - Cloud Storage Exceeded",
        "sender_name": "CloudDrive Storage Admin",
        "sender_email_display": "no-reply@cloud-storage-notifications.com",
        "lure_description": "Simulates a cloud storage quota exceeded warning threatening incoming email deletion.",
        "generate_html": lambda target_email, sim_url: f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storage Alert: 99.4% Full</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
    <!-- Educational Top Banner -->
    <div style="background-color: #1e293b; border-bottom: 1px solid #334155; padding: 10px 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        🛡️ <strong style="color: #38bdf8;">PhishGuard Educational Simulation</strong> &mdash; This is an authorized academic security awareness training exercise.
    </div>

    <!-- Email Content Card -->
    <div style="max-width: 580px; margin: 30px auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <div style="padding: 24px 32px; background-color: #0f172a; border-bottom: 1px solid #334155;">
            <div style="color: #f59e0b; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                ⚠️ Storage Critical Warning
            </div>
            <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #f8fafc;">
                Your Cloud Drive is Almost Full
            </h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Account: <strong style="color: #f8fafc;">{target_email}</strong>
            </p>

            <!-- Progress Bar -->
            <div style="background-color: #0f172a; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
                    <span style="color: #94a3b8;">Used Space: <strong>14.9 GB / 15.0 GB</strong></span>
                    <span style="color: #ef4444; font-weight: bold;">99.4% Full</span>
                </div>
                <div style="width: 100%; height: 10px; background-color: #334155; border-radius: 5px; overflow: hidden;">
                    <div style="width: 99.4%; height: 100%; background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%);"></div>
                </div>
            </div>

            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Because your storage limit has been exceeded, <strong style="color: #ef4444;">14 incoming messages and sync files are currently on hold</strong> and will be permanently bounced in 12 hours.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="{sim_url}" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #0f172a; font-weight: 700; font-size: 15px; padding: 14px 32px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                    Upgrade Free Quota & Release Messages &rarr;
                </a>
            </div>

            <p style="margin: 0 0 24px 0; font-size: 11px; color: #38bdf8; word-break: break-all; text-align: center; font-family: monospace;">
                {sim_url}
            </p>
        </div>

        <!-- Educational Disclaimer Footer -->
        <div style="background-color: #0f172a; padding: 18px 32px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; line-height: 1.5;">
            <strong style="color: #94a3b8;">🎓 Academic Security Training Notice:</strong><br>
            This email is an authorized cybersecurity test from <strong>PhishGuard</strong>. It models artificial quota urgency. Never submit authentic credentials on unverified third-party pages.
        </div>
    </div>
</body>
</html>""",
        "generate_text": lambda target_email, sim_url: f"""[PhishGuard Educational Simulation]
=========================================
Storage Alert: Your Cloud Storage is 99.4% Full

Account: {target_email}
14 incoming messages are currently on hold.

To claim extra storage and release your messages, visit:
{sim_url}

---
ACADEMIC NOTICE: This is an educational security awareness simulation generated by PhishGuard. Do not enter real credentials.
"""
    },

    "hr-policy-update": {
        "id": "hr-policy-update",
        "name": "HR & Payroll Compliance Review",
        "category": "Corporate / Policy",
        "difficulty": "Hard",
        "subject": "⚠️ EDUCATIONAL SECURITY TEST - DO NOT CLICK: Mandatory HR Policy Review",
        "sender_name": "Human Resources Portal",
        "sender_email_display": "compliance@hr-internal-portal.org",
        "lure_description": "Simulates an internal HR compliance mandate requiring immediate acknowledgment to avoid payroll hold.",
        "generate_html": lambda target_email, sim_url: f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mandatory HR Compliance Review</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
    <!-- Educational Top Banner -->
    <div style="background-color: #1e293b; border-bottom: 1px solid #334155; padding: 10px 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        🛡️ <strong style="color: #38bdf8;">PhishGuard Educational Simulation</strong> &mdash; This is an authorized academic security awareness training exercise.
    </div>

    <!-- Email Content Card -->
    <div style="max-width: 580px; margin: 30px auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <div style="padding: 24px 32px; background-color: #1f2937; border-bottom: 1px solid #374151;">
            <div style="color: #10b981; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                Internal Compliance & Payroll Department
            </div>
            <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #f8fafc;">
                Mandatory Policy Acknowledgment
            </h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Dear Employee (<strong style="color: #f8fafc;">{target_email}</strong>),
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                All personnel are required to review and electronically sign the newly updated <strong>2026 Remote Work & Digital Security Code of Conduct</strong>.
            </p>

            <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #fca5a5; background-color: #450a0a; border: 1px solid #7f1d1d; padding: 12px 16px; border-radius: 6px;">
                ❗ <strong>Deadline:</strong> Failure to complete sign-off prior to end-of-week will result in automated payroll access delays.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="{sim_url}" target="_blank" style="display: inline-block; background-color: #10b981; color: #042f2e; font-weight: 700; font-size: 15px; padding: 14px 32px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    Review & Sign HR Document &rarr;
                </a>
            </div>

            <p style="margin: 0 0 24px 0; font-size: 11px; color: #38bdf8; word-break: break-all; text-align: center; font-family: monospace;">
                {sim_url}
            </p>
        </div>

        <!-- Educational Disclaimer Footer -->
        <div style="background-color: #030712; padding: 18px 32px; border-top: 1px solid #1f2937; font-size: 11px; color: #64748b; line-height: 1.5;">
            <strong style="color: #94a3b8;">🎓 Academic Security Training Notice:</strong><br>
            This simulation is generated by <strong>PhishGuard</strong> to train users to identify authority-based compliance impersonation attacks.
        </div>
    </div>
</body>
</html>""",
        "generate_text": lambda target_email, sim_url: f"""[PhishGuard Educational Simulation]
=========================================
HR Compliance - Mandatory Policy Review

Dear {target_email},

Please review and sign the updated 2026 Remote Work & Security Policy:
{sim_url}

---
ACADEMIC NOTICE: This is an educational security awareness simulation generated by PhishGuard. Do not enter real credentials.
"""
    }
}

def get_template(template_id: str) -> Dict[str, Any]:
    return TEMPLATES.get(template_id, TEMPLATES["nordvault-security"])

def list_templates() -> List[Dict[str, Any]]:
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "category": t["category"],
            "difficulty": t["difficulty"],
            "subject": t["subject"],
            "sender_name": t["sender_name"],
            "sender_email_display": t["sender_email_display"],
            "lure_description": t["lure_description"]
        }
        for t in TEMPLATES.values()
    ]
