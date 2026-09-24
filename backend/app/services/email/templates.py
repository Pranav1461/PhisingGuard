"""
Fraud Simulation Email Templates for PhishGuard.

Covers 7 scenario categories with multiple variants each:
  1. Account / Login
  2. Subscription / Billing
  3. Storage
  4. Delivery
  5. Reward / Prize
  6. Support / Technical Scam
  7. HR / Document

All templates use fictional organisations. No real banks, tech companies,
governments, or brands are impersonated.
"""

from typing import Dict, Any, List

# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────────────────

def _sim_banner() -> str:
    return """
    <div style="background:#7f1d1d;border-bottom:3px solid #ef4444;padding:12px 20px;
                text-align:center;font-size:12px;color:#fecaca;">
      <strong style="color:#fca5a5;">🚨 PHISHGUARD SECURITY SIMULATION — DO NOT ENTER REAL CREDENTIALS</strong><br>
      <span style="font-size:11px;">This is a controlled fraud awareness exercise. Never submit real information on suspicious links.</span>
    </div>"""

def _sim_footer(detail: str = "") -> str:
    body = detail or "This simulation demonstrates a common social engineering attack. Never click suspicious links or enter credentials without verifying the sender."
    return f"""
        <div style="background:#030712;padding:16px 28px;border-top:1px solid #1f2937;font-size:11px;color:#64748b;line-height:1.5;">
          <strong style="color:#94a3b8;">🔒 PhishGuard Fraud Simulation:</strong><br>{body}
        </div>"""

def _card_open(bg: str = "#111827", border: str = "#1f2937") -> str:
    return f"""
    <div style="max-width:580px;margin:28px auto;background:{bg};border:1px solid {border};
                border-radius:12px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">"""

def _card_close() -> str:
    return "</div>"

def _cta_button(url: str, label: str, color: str = "#2563eb", text_color: str = "#ffffff") -> str:
    return f"""
            <div style="text-align:center;margin:28px 0;">
              <a href="{url}" target="_blank"
                 style="display:inline-block;background:{color};color:{text_color};
                        font-weight:600;font-size:14px;padding:13px 30px;
                        text-decoration:none;border-radius:8px;">
                {label} &rarr;
              </a>
            </div>
            <p style="margin:0 0 20px 0;font-size:11px;color:#38bdf8;
                      word-break:break-all;text-align:center;font-family:monospace;">{url}</p>"""

def _base_wrapper(banner: str, card: str, footer: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0b0f19;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0;">
  {banner}
  {card}
</body>
</html>"""


# ─────────────────────────────────────────────────────────────────────────────
# Template factory helpers per interaction type
# ─────────────────────────────────────────────────────────────────────────────

def _make_account_html(org: str, urgency_msg: str, cta_label: str) -> Any:
    def gen(target_email: str, sim_url: str) -> str:
        return _base_wrapper(
            _sim_banner(),
            _card_open() + f"""
        <div style="padding:22px 28px;background:#1e293b;border-bottom:1px solid #334155;">
          <span style="color:#60a5fa;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;">{org} — Security Alert</span>
          <h1 style="margin:8px 0 0 0;font-size:19px;font-weight:700;color:#f8fafc;">Account Verification Required</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#cbd5e1;">Dear <strong style="color:#f8fafc;">{target_email}</strong>,</p>
          <p style="margin:0 0 18px 0;font-size:14px;color:#94a3b8;line-height:1.6;">{urgency_msg}</p>
          <div style="background:#1e1b4b;border-left:4px solid #6366f1;padding:13px 15px;border-radius:4px;margin-bottom:22px;">
            <p style="margin:0;font-size:13px;color:#e0e7ff;">⏳ <strong>Your account will be suspended</strong> within 24 hours unless you verify your identity.</p>
          </div>
          {_cta_button(sim_url, cta_label)}
        </div>
        {_sim_footer()}""" + _card_close(),
            ""
        )
    return gen

def _make_subscription_html(org: str, service_type: str, problem: str, cta_label: str) -> Any:
    def gen(target_email: str, sim_url: str) -> str:
        return _base_wrapper(
            _sim_banner(),
            _card_open("#0f172a", "#334155") + f"""
        <div style="padding:22px 28px;background:#1e293b;border-bottom:1px solid #334155;">
          <span style="color:#f59e0b;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">{org} — Billing Notice</span>
          <h1 style="margin:8px 0 0 0;font-size:19px;font-weight:700;color:#f8fafc;">{service_type}: Action Required</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#cbd5e1;">Account: <strong style="color:#f8fafc;">{target_email}</strong></p>
          <p style="margin:0 0 18px 0;font-size:14px;color:#94a3b8;line-height:1.6;">{problem}</p>
          <div style="background:#451a03;border-left:4px solid #f59e0b;padding:13px 15px;border-radius:4px;margin-bottom:22px;">
            <p style="margin:0;font-size:13px;color:#fef3c7;">⚠️ <strong>Service access will be interrupted</strong> if not resolved within 48 hours.</p>
          </div>
          {_cta_button(sim_url, cta_label, "#f59e0b", "#0f172a")}
        </div>
        {_sim_footer("This simulation shows how billing urgency emails are used to steal payment credentials.")}""" + _card_close(),
            ""
        )
    return gen

def _make_storage_html(org: str, percent: str, amount: str, cta_label: str) -> Any:
    def gen(target_email: str, sim_url: str) -> str:
        return _base_wrapper(
            _sim_banner(),
            _card_open("#0f172a", "#334155") + f"""
        <div style="padding:22px 28px;background:#0f172a;border-bottom:1px solid #334155;">
          <span style="color:#f59e0b;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">⚠️ Storage Critical Warning</span>
          <h1 style="margin:8px 0 0 0;font-size:19px;font-weight:700;color:#f8fafc;">{org} — Storage Almost Full</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#cbd5e1;">Account: <strong style="color:#f8fafc;">{target_email}</strong></p>
          <div style="background:#0f172a;border-radius:8px;padding:14px;margin:18px 0;border:1px solid #334155;">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:7px;">
              <span style="color:#94a3b8;">Storage Used: <strong>{amount}</strong></span>
              <span style="color:#ef4444;font-weight:700;">{percent} Full</span>
            </div>
            <div style="width:100%;height:10px;background:#334155;border-radius:5px;overflow:hidden;">
              <div style="width:{percent};height:100%;background:linear-gradient(90deg,#f59e0b,#ef4444);"></div>
            </div>
          </div>
          <p style="margin:0 0 18px 0;font-size:13px;color:#94a3b8;line-height:1.6;">
            New files and incoming messages are being held. They will be permanently deleted in <strong style="color:#ef4444;">12 hours</strong> unless you upgrade your storage plan.
          </p>
          {_cta_button(sim_url, cta_label, "#f59e0b", "#0f172a")}
        </div>
        {_sim_footer("Storage scams use fear of data loss to push users into clicking phishing links.")}""" + _card_close(),
            ""
        )
    return gen

def _make_delivery_html(carrier: str, parcel_id: str, problem: str, cta_label: str) -> Any:
    def gen(target_email: str, sim_url: str) -> str:
        return _base_wrapper(
            _sim_banner(),
            _card_open("#0a0f1a", "#1e293b") + f"""
        <div style="padding:22px 28px;background:#1e293b;border-bottom:1px solid #334155;">
          <span style="color:#34d399;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">{carrier} — Delivery Update</span>
          <h1 style="margin:8px 0 0 0;font-size:19px;font-weight:700;color:#f8fafc;">{problem}</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#cbd5e1;">Dear <strong style="color:#f8fafc;">{target_email}</strong>,</p>
          <div style="background:#0f172a;border-radius:8px;padding:14px;margin-bottom:18px;border:1px solid #1e293b;">
            <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;font-family:monospace;text-transform:uppercase;">Tracking ID</p>
            <p style="margin:0;font-size:15px;font-weight:700;color:#34d399;font-family:monospace;">{parcel_id}</p>
          </div>
          <p style="margin:0 0 18px 0;font-size:14px;color:#94a3b8;line-height:1.6;">
            We attempted delivery but were unable to complete it. <strong style="color:#fbbf24;">Your parcel will be returned to sender within 24 hours</strong> unless you confirm your delivery details.
          </p>
          {_cta_button(sim_url, cta_label, "#34d399", "#042f2e")}
        </div>
        {_sim_footer("Parcel scams impersonate couriers to collect home addresses, fees, and personal data.")}""" + _card_close(),
            ""
        )
    return gen

def _make_reward_html(org: str, reward_type: str, amount: str, cta_label: str) -> Any:
    def gen(target_email: str, sim_url: str) -> str:
        return _base_wrapper(
            _sim_banner(),
            _card_open("#0a0a18", "#2d2254") + f"""
        <div style="padding:22px 28px;background:linear-gradient(135deg,#1e1b4b,#312e81);border-bottom:1px solid #4338ca;">
          <span style="color:#a5b4fc;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">🎉 {org} — Reward Programme</span>
          <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:700;color:#f8fafc;">Congratulations! You've been selected.</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#cbd5e1;">Dear <strong style="color:#f8fafc;">{target_email}</strong>,</p>
          <div style="background:#1e1b4b;border:2px solid #4f46e5;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
            <p style="margin:0 0 6px 0;font-size:12px;color:#a5b4fc;text-transform:uppercase;letter-spacing:1px;">Your {reward_type}</p>
            <p style="margin:0;font-size:32px;font-weight:800;color:#fbbf24;">{amount}</p>
          </div>
          <p style="margin:0 0 18px 0;font-size:13px;color:#94a3b8;line-height:1.6;">
            This reward expires in <strong style="color:#ef4444;">48 hours</strong>. Claim now to avoid losing your prize. Verification required to process the transfer.
          </p>
          {_cta_button(sim_url, cta_label, "#4f46e5", "#ffffff")}
        </div>
        {_sim_footer("Reward scams use excitement and scarcity to bypass critical thinking.")}""" + _card_close(),
            ""
        )
    return gen

def _make_support_html(org: str, issue: str, cta_label: str) -> Any:
    def gen(target_email: str, sim_url: str) -> str:
        return _base_wrapper(
            _sim_banner(),
            _card_open("#0b0f19", "#1f2937") + f"""
        <div style="padding:22px 28px;background:#1f2937;border-bottom:1px solid #374151;">
          <span style="color:#f87171;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">🔴 {org} — Security Alert</span>
          <h1 style="margin:8px 0 0 0;font-size:19px;font-weight:700;color:#f8fafc;">{issue}</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#cbd5e1;">Account: <strong style="color:#f8fafc;">{target_email}</strong></p>
          <div style="background:#450a0a;border-left:4px solid #ef4444;padding:13px 15px;border-radius:4px;margin-bottom:20px;">
            <p style="margin:0;font-size:13px;color:#fecaca;line-height:1.5;">
              🚨 <strong>Immediate action required.</strong> Our security systems have flagged unusual activity associated with your account. A support representative needs to verify your identity.
            </p>
          </div>
          <p style="margin:0 0 18px 0;font-size:13px;color:#94a3b8;line-height:1.6;">
            Please do <strong>not</strong> access your account until verification is complete. Click below to open a secure support session.
          </p>
          {_cta_button(sim_url, cta_label, "#ef4444", "#ffffff")}
        </div>
        {_sim_footer("Technical support scams create fake urgency to make users hand over account access.")}""" + _card_close(),
            ""
        )
    return gen

def _make_hr_html(company: str, document: str, deadline: str, cta_label: str) -> Any:
    def gen(target_email: str, sim_url: str) -> str:
        return _base_wrapper(
            _sim_banner(),
            _card_open("#0b0f19", "#1f2937") + f"""
        <div style="padding:22px 28px;background:#1f2937;border-bottom:1px solid #374151;">
          <span style="color:#10b981;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">{company} — Internal HR Portal</span>
          <h1 style="margin:8px 0 0 0;font-size:19px;font-weight:700;color:#f8fafc;">{document}</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#cbd5e1;">Dear Employee (<strong style="color:#f8fafc;">{target_email}</strong>),</p>
          <p style="margin:0 0 18px 0;font-size:14px;color:#94a3b8;line-height:1.6;">
            This is a mandatory request from the HR & Compliance department. Please review and complete the attached action before the deadline.
          </p>
          <div style="background:#450a0a;border:1px solid #7f1d1d;padding:12px 15px;border-radius:6px;margin-bottom:22px;">
            <p style="margin:0;font-size:13px;color:#fca5a5;">
              ❗ <strong>Deadline: {deadline}.</strong> Failure to complete will result in temporary payroll access delays.
            </p>
          </div>
          {_cta_button(sim_url, cta_label, "#10b981", "#042f2e")}
        </div>
        {_sim_footer("HR impersonation attacks exploit authority and payroll fears to steal credentials.")}""" + _card_close(),
            ""
        )
    return gen

def _text_generic(org: str, body: str) -> Any:
    def gen(target_email: str, sim_url: str) -> str:
        return f"""[PhishGuard Fraud Simulation]
=========================================
{org}

To: {target_email}

{body}

Action required:
{sim_url}

---
NOTICE: This is a fraud-awareness simulation by PhishGuard. Do NOT enter real credentials.
"""
    return gen


# ─────────────────────────────────────────────────────────────────────────────
# TEMPLATES dictionary
# ─────────────────────────────────────────────────────────────────────────────

TEMPLATES: Dict[str, Dict[str, Any]] = {

    # ── 1. ACCOUNT / LOGIN ────────────────────────────────────────────────────

    "nordvault-security": {
        "id": "nordvault-security",
        "name": "NordVault — Suspicious Login Alert",
        "category": "Account / Login",
        "scenario_type": "login",
        "difficulty": "Medium",
        "subject": "Action Required: Unusual sign-in detected on your NordVault account",
        "sender_name": "NordVault Security Team",
        "sender_email_display": "security-alerts@nordvault-mail.nfo",
        "fictional_org": "NordVault Mail",
        "manipulation": ["urgency", "fear", "authority"],
        "red_flags": ["suspicious sender domain (.nfo)", "account suspension threat", "unfamiliar IP address"],
        "safe_action": "Navigate directly to nordvault-mail.nfo — do not click email links.",
        "lure_description": "Simulates an urgent account security alert claiming your mailbox will be locked in 24 hours.",
        "generate_html": _make_account_html(
            "NordVault Mail",
            "Our automated threat-detection systems blocked an unrecognised sign-in attempt from an untrusted device (IP: 185.220.101.5 — Frankfurt, DE). If this was not you, your mailbox may be compromised.",
            "Verify Identity & Keep Access"
        ),
        "generate_text": _text_generic("NordVault Mail — Security Alert", "Unusual sign-in detected. Verify your identity to prevent account suspension."),
    },

    "vertexlabs-account": {
        "id": "vertexlabs-account",
        "name": "Vertex Labs — Account Verification",
        "category": "Account / Login",
        "scenario_type": "login",
        "difficulty": "Medium",
        "subject": "Verify your Vertex Labs account — action required within 24 hours",
        "sender_name": "Vertex Labs Account Services",
        "sender_email_display": "accounts@vertexlabs-secure.org",
        "fictional_org": "Vertex Labs",
        "manipulation": ["urgency", "authority"],
        "red_flags": ["non-official domain (.org for a tech company)", "unsolicited request", "tight deadline"],
        "safe_action": "Log in to Vertex Labs directly via the official app — never follow email links.",
        "lure_description": "Simulates a platform account verification notice from Vertex Labs.",
        "generate_html": _make_account_html(
            "Vertex Labs",
            "Our records indicate your account email has not been verified within the required period. To maintain uninterrupted access to Vertex Labs services, please verify your address.",
            "Verify My Account"
        ),
        "generate_text": _text_generic("Vertex Labs — Account Services", "Account verification required. Click below to confirm your email and prevent service interruption."),
    },

    "northstar-password": {
        "id": "northstar-password",
        "name": "Northstar Systems — Password Expiry",
        "category": "Account / Login",
        "scenario_type": "login",
        "difficulty": "Easy",
        "subject": "Your Northstar Systems password expires in 24 hours — reset required",
        "sender_name": "Northstar IT Help Desk",
        "sender_email_display": "helpdesk@northstar-systems-portal.com",
        "fictional_org": "Northstar Systems",
        "manipulation": ["urgency", "authority", "fear"],
        "red_flags": ["password expiry is rarely communicated via email links", "suspicious domain", "deadline pressure"],
        "safe_action": "Change passwords via the official IT portal directly — never via emailed links.",
        "lure_description": "Simulates a corporate IT password-expiry warning demanding immediate reset.",
        "generate_html": _make_account_html(
            "Northstar Systems IT",
            "Your corporate network password is scheduled to expire in 24 hours. After expiry, you will be locked out of all Northstar Systems services including email, VPN, and the intranet.",
            "Reset Password Now"
        ),
        "generate_text": _text_generic("Northstar Systems IT Help Desk", "Your corporate password expires in 24 hours. Reset it immediately to avoid access lockout."),
    },

    "bluewave-suspension": {
        "id": "bluewave-suspension",
        "name": "Bluewave — Account Suspension Notice",
        "category": "Account / Login",
        "scenario_type": "login",
        "difficulty": "Hard",
        "subject": "Urgent: Your Bluewave account has been temporarily suspended",
        "sender_name": "Bluewave Trust & Safety",
        "sender_email_display": "trust-safety@bluewave-accounts.net",
        "fictional_org": "Bluewave",
        "manipulation": ["fear", "authority", "urgency"],
        "red_flags": ["account suspension without prior notice", "third-party domain", "appeal link in email"],
        "safe_action": "Appeal suspensions only through the official Bluewave support portal — not via email links.",
        "lure_description": "Simulates an account suspension notice with an appeal link.",
        "generate_html": _make_account_html(
            "Bluewave Trust & Safety",
            "Following a review of your account activity, your Bluewave account has been temporarily suspended pending identity verification. This is required to comply with our updated security policies.",
            "Verify Identity to Restore Access"
        ),
        "generate_text": _text_generic("Bluewave Trust & Safety", "Your account has been temporarily suspended. Verify your identity to restore access."),
    },

    # ── 2. SUBSCRIPTION / BILLING ─────────────────────────────────────────────

    "streambox-payment": {
        "id": "streambox-payment",
        "name": "StreamBox — Payment Failed",
        "category": "Subscription / Billing",
        "scenario_type": "subscription",
        "difficulty": "Medium",
        "subject": "StreamBox: Payment failed — update your billing details now",
        "sender_name": "StreamBox Billing",
        "sender_email_display": "billing@streambox-payments.io",
        "fictional_org": "StreamBox",
        "manipulation": ["fear", "urgency"],
        "red_flags": ["non-official billing domain", "unsolicited payment request", "account cancellation threat"],
        "safe_action": "Update payment details only through the official StreamBox app or website.",
        "lure_description": "Simulates a failed streaming subscription payment notice.",
        "generate_html": _make_subscription_html(
            "StreamBox",
            "Payment Failed",
            "We were unable to charge your payment method on file for your StreamBox Premium subscription (£12.99/month). Your subscription will be cancelled in 48 hours unless payment details are updated.",
            "Update Payment Details"
        ),
        "generate_text": _text_generic("StreamBox Billing", "Your StreamBox payment failed. Update your billing details to avoid cancellation."),
    },

    "tunewave-renewal": {
        "id": "tunewave-renewal",
        "name": "TuneWave — Subscription Ending",
        "category": "Subscription / Billing",
        "scenario_type": "subscription",
        "difficulty": "Easy",
        "subject": "TuneWave: Your subscription ends tomorrow — renew to keep listening",
        "sender_name": "TuneWave Subscriptions",
        "sender_email_display": "subscriptions@tunewave-renewal.com",
        "fictional_org": "TuneWave",
        "manipulation": ["urgency", "scarcity"],
        "red_flags": ["renewal-specific subdomain", "unsolicited deadline", "renewal link embedded in email"],
        "safe_action": "Renew only via the official TuneWave app — email renewal links may be fraudulent.",
        "lure_description": "Simulates a subscription renewal reminder for a music streaming service.",
        "generate_html": _make_subscription_html(
            "TuneWave",
            "Subscription Ending Tomorrow",
            "Your TuneWave Unlimited subscription is set to expire tomorrow. After expiry, your playlists and downloads will be removed and you will lose access to ad-free listening.",
            "Renew My Subscription"
        ),
        "generate_text": _text_generic("TuneWave Subscriptions", "Your TuneWave subscription ends tomorrow. Renew now to keep your playlists."),
    },

    "prizehub-spin-win": {
        "id": "prizehub-spin-win",
        "name": "PrizeHub — Spin & Win Reward",
        "category": "Reward / Prize",
        "scenario_type": "reward",
        "difficulty": "Medium",
        "subject": "PrizeHub: Congratulations! You won a prize — claim it now",
        "sender_name": "PrizeHub Rewards Team",
        "sender_email_display": "rewards@prizehub-claims.co",
        "fictional_org": "PrizeHub",
        "manipulation": ["curiosity", "reward", "urgency"],
        "red_flags": ["unexpected prize notification", "suspicious domain", "payment required to claim free prize"],
        "safe_action": "Ignore unsolicited prize notifications. Legitimate prizes never require payment or personal details to claim.",
        "lure_description": "Simulates a spin-the-wheel prize notification requiring payment to claim a 'free' reward.",
        "generate_html": _make_reward_html(
            "PrizeHub",
            "🎁 You're a Winner!",
            "Congratulations! You've won an exclusive prize in our monthly giveaway. Spin our digital wheel to reveal your reward and claim it before it expires.",
            "Spin & Claim Prize"
        ),
        "generate_text": _text_generic("PrizeHub Rewards", "You've won a prize! Spin the wheel to reveal and claim your reward."),
    },

    "cloudvault-billing": {
        "id": "cloudvault-billing",
        "name": "CloudVault — Billing Problem",
        "category": "Subscription / Billing",
        "scenario_type": "subscription",
        "difficulty": "Medium",
        "subject": "CloudVault: Billing issue detected — your plan is at risk",
        "sender_name": "CloudVault Account Management",
        "sender_email_display": "accounts@cloudvault-manage.com",
        "fictional_org": "CloudVault",
        "manipulation": ["fear", "urgency", "authority"],
        "red_flags": ["vague 'billing issue' with no detail", "non-official management domain", "plan cancellation threat"],
        "safe_action": "Review billing only via the official CloudVault dashboard — not via email links.",
        "lure_description": "Simulates a vague billing problem notice for a cloud storage service.",
        "generate_html": _make_subscription_html(
            "CloudVault",
            "Billing Problem Detected",
            "We have detected a billing discrepancy on your CloudVault Business account. Your subscription may be interrupted unless you review and confirm your current payment method.",
            "Review Billing Now"
        ),
        "generate_text": _text_generic("CloudVault Account Management", "A billing issue has been detected. Review your payment method to prevent service interruption."),
    },

    # ── 3. STORAGE ────────────────────────────────────────────────────────────

    "storage-quota": {
        "id": "storage-quota",
        "name": "CloudDrive — Storage Full (Fear of Loss)",
        "category": "Storage",
        "scenario_type": "storage",
        "difficulty": "Easy",
        "subject": "Storage Alert: Your CloudDrive is 99.4% full — incoming messages blocked",
        "sender_name": "CloudDrive Storage Admin",
        "sender_email_display": "no-reply@cloud-storage-notifications.com",
        "fictional_org": "CloudDrive",
        "manipulation": ["fear", "urgency"],
        "red_flags": ["notification domain doesn't match service", "incoming email deletion threat", "unsolicited upgrade prompt"],
        "safe_action": "Check your storage via the official CloudDrive app — not via email links.",
        "lure_description": "Simulates a cloud storage quota exceeded warning threatening incoming email deletion.",
        "generate_html": _make_storage_html("CloudDrive", "99.4%", "14.9 GB / 15 GB", "Upgrade Storage & Release Messages"),
        "generate_text": _text_generic("CloudDrive Storage Admin", "Your CloudDrive is 99.4% full. Upgrade to prevent incoming messages from being deleted."),
    },

    "cloudvault-storage": {
        "id": "cloudvault-storage",
        "name": "CloudVault — Backup Storage Full",
        "category": "Storage",
        "scenario_type": "storage",
        "difficulty": "Easy",
        "subject": "CloudVault: Your backup storage is full — backups paused",
        "sender_name": "CloudVault Backup Service",
        "sender_email_display": "backup-alerts@cloudvault-storage.io",
        "fictional_org": "CloudVault Backup",
        "manipulation": ["fear", "urgency"],
        "red_flags": ["storage-specific subdomain", "backup paused threat", "immediate action framing"],
        "safe_action": "Check backup status in the official CloudVault app — do not click email links.",
        "lure_description": "Simulates a backup storage full alert from CloudVault.",
        "generate_html": _make_storage_html("CloudVault Backup", "97.8%", "97.8 GB / 100 GB", "Expand Backup Storage"),
        "generate_text": _text_generic("CloudVault Backup", "Your backup storage is full. Automatic backups have paused. Expand your storage to resume."),
    },

    "photovault-storage": {
        "id": "photovault-storage",
        "name": "PhotoVault — Photo Storage Full",
        "category": "Storage",
        "scenario_type": "storage",
        "difficulty": "Easy",
        "subject": "PhotoVault: Your photo library is almost full — new uploads blocked",
        "sender_name": "PhotoVault Storage Team",
        "sender_email_display": "storage@photovault-limits.com",
        "fictional_org": "PhotoVault",
        "manipulation": ["fear", "scarcity"],
        "red_flags": ["limits-specific domain", "new upload blocking threat", "automatic photo deletion warning"],
        "safe_action": "Manage your photo storage through the official PhotoVault app — email links may be fraudulent.",
        "lure_description": "Simulates a photo storage full warning for a cloud photo service.",
        "generate_html": _make_storage_html("PhotoVault", "98.1%", "14.7 GB / 15 GB", "Free Up Space / Upgrade Plan"),
        "generate_text": _text_generic("PhotoVault Storage", "Your photo library is almost full. New uploads are blocked. Upgrade to continue."),
    },

    # ── 4. DELIVERY ───────────────────────────────────────────────────────────

    "parcelpro-failed": {
        "id": "parcelpro-failed",
        "name": "ParcelPro — Delivery Failed",
        "category": "Delivery",
        "scenario_type": "delivery",
        "difficulty": "Medium",
        "subject": "ParcelPro: Delivery attempt failed — confirm address to reschedule",
        "sender_name": "ParcelPro Delivery Services",
        "sender_email_display": "delivery@parcelpro-notifications.com",
        "fictional_org": "ParcelPro",
        "manipulation": ["urgency", "fear"],
        "red_flags": ["notification-specific domain", "address confirmation via email", "24-hour return threat"],
        "safe_action": "Track deliveries via the official ParcelPro website — never confirm addresses via email links.",
        "lure_description": "Simulates a failed delivery notice asking the recipient to confirm their address.",
        "generate_html": _make_delivery_html("ParcelPro", "PPR-47291038-UK", "Delivery Attempt Failed", "Confirm Address & Reschedule"),
        "generate_text": _text_generic("ParcelPro Delivery", "We attempted delivery but failed. Confirm your address to reschedule or the parcel will be returned."),
    },

    "swiftship-customs": {
        "id": "swiftship-customs",
        "name": "SwiftShip — Customs Fee Required",
        "category": "Delivery",
        "scenario_type": "delivery",
        "difficulty": "Hard",
        "subject": "SwiftShip: Your parcel is held in customs — pay fee to release",
        "sender_name": "SwiftShip Customs Clearance",
        "sender_email_display": "customs@swiftship-clearance.net",
        "fictional_org": "SwiftShip",
        "manipulation": ["urgency", "fear", "authority"],
        "red_flags": ["clearance-specific domain", "unexpected customs fee request", "parcel return threat"],
        "safe_action": "Legitimate customs fees are handled through official government portals — not via email links.",
        "lure_description": "Simulates a customs fee demand from a fake courier service.",
        "generate_html": _make_delivery_html("SwiftShip Customs", "SWS-8820471-INT", "Parcel Held: Customs Fee Required", "Pay Customs Fee & Release Parcel"),
        "generate_text": _text_generic("SwiftShip Customs Clearance", "Your international parcel requires a customs clearance fee of £2.99. Pay now to avoid return."),
    },

    "parcelpro-redelivery": {
        "id": "parcelpro-redelivery",
        "name": "ParcelPro — Redelivery Required",
        "category": "Delivery",
        "scenario_type": "delivery",
        "difficulty": "Easy",
        "subject": "ParcelPro: Schedule your redelivery — parcel held at depot",
        "sender_name": "ParcelPro Customer Services",
        "sender_email_display": "redelivery@parcelpro-services.org",
        "fictional_org": "ParcelPro",
        "manipulation": ["urgency"],
        "red_flags": ["services-specific subdomain", "address requested via email", "storage fee threat"],
        "safe_action": "Schedule redeliveries via the official ParcelPro website — never through email links.",
        "lure_description": "Simulates a parcel redelivery scheduling request from a courier.",
        "generate_html": _make_delivery_html("ParcelPro", "PPR-66104920-UK", "Parcel Awaiting Redelivery", "Schedule My Redelivery"),
        "generate_text": _text_generic("ParcelPro Redelivery", "Your parcel is held at our depot. Schedule a redelivery or it will be returned after 5 days."),
    },

    # ── 5. REWARD / PRIZE ─────────────────────────────────────────────────────

    "cashback-reward": {
        "id": "cashback-reward",
        "name": "CashBack Hub — Cashback Reward",
        "category": "Reward / Prize",
        "scenario_type": "reward",
        "difficulty": "Easy",
        "subject": "You've earned £85 cashback — claim before it expires!",
        "sender_name": "CashBack Hub Rewards",
        "sender_email_display": "rewards@cashbackhub-claims.com",
        "fictional_org": "CashBack Hub",
        "manipulation": ["reward", "urgency", "curiosity"],
        "red_flags": ["claims-specific domain", "unsolicited cashback", "expiry pressure"],
        "safe_action": "Verify cashback via the official CashBack Hub account — unsolicited reward emails are almost always scams.",
        "lure_description": "Simulates a cashback reward email with a short expiry to create urgency.",
        "generate_html": _make_reward_html("CashBack Hub", "Cashback Reward", "£85.00", "Claim My Cashback Now"),
        "generate_text": _text_generic("CashBack Hub Rewards", "You have £85 cashback waiting. Claim within 48 hours before it expires."),
    },

    "loyaltyplus-prize": {
        "id": "loyaltyplus-prize",
        "name": "LoyaltyPlus — Contest Winner",
        "category": "Reward / Prize",
        "scenario_type": "reward",
        "difficulty": "Medium",
        "subject": "Congratulations! You've won a £500 shopping voucher",
        "sender_name": "LoyaltyPlus Prize Team",
        "sender_email_display": "prizes@loyaltyplus-winners.net",
        "fictional_org": "LoyaltyPlus",
        "manipulation": ["reward", "excitement", "scarcity"],
        "red_flags": ["prize-specific domain", "no contest entry remembered", "claim-or-lose urgency"],
        "safe_action": "You cannot win a contest you did not enter — delete unsolicited prize emails.",
        "lure_description": "Simulates a prize winner notification from a fictional loyalty programme.",
        "generate_html": _make_reward_html("LoyaltyPlus", "Shopping Voucher Prize", "£500 Voucher", "Claim My Prize"),
        "generate_text": _text_generic("LoyaltyPlus Prize Team", "You have won a £500 shopping voucher. Claim within 24 hours."),
    },

    "cashback-wheel": {
        "id": "cashback-wheel",
        "name": "CashBack Central — Lucky Wheel Winner",
        "category": "Reward / Prize",
        "scenario_type": "reward",
        "difficulty": "Easy",
        "subject": "CashBack Central: Spin the wheel — you're today's lucky winner!",
        "sender_name": "CashBack Central Promotions",
        "sender_email_display": "winners@cashbackcentral-promo.net",
        "fictional_org": "CashBack Central",
        "manipulation": ["curiosity", "reward", "urgency"],
        "red_flags": ["unsolicited prize notification", "promo-specific domain", "payment required to claim free prize"],
        "safe_action": "Ignore unsolicited prize notifications. Legitimate prizes never require payment to claim.",
        "lure_description": "Simulates a lucky wheel spin prize notification requiring payment to claim the reward.",
        "generate_html": _make_reward_html("CashBack Central", "🎯 You're Today's Winner!", "Spin our exclusive wheel to reveal your prize", "Spin & Win Now"),
        "generate_text": _text_generic("CashBack Central", "You've been selected as today's lucky winner! Spin the wheel to reveal your prize."),
    },

    # ── 6. SUPPORT / TECHNICAL SCAM ───────────────────────────────────────────

    "northstar-security-warning": {
        "id": "northstar-security-warning",
        "name": "Northstar Systems — Suspicious Activity",
        "category": "Support / Technical",
        "scenario_type": "support",
        "difficulty": "Hard",
        "subject": "Northstar Systems: Suspicious activity detected — verify account now",
        "sender_name": "Northstar Security Operations",
        "sender_email_display": "security-ops@northstar-alerts.org",
        "fictional_org": "Northstar Systems",
        "manipulation": ["fear", "authority", "urgency"],
        "red_flags": ["alerts-specific domain", "unsolicited security contact", "account access suspension threat"],
        "safe_action": "Contact Northstar support directly via the official website — never via email links.",
        "lure_description": "Simulates a fake security operations notice about suspicious account activity.",
        "generate_html": _make_support_html(
            "Northstar Systems",
            "Suspicious Account Activity Detected",
            "Open Secure Support Session"
        ),
        "generate_text": _text_generic("Northstar Security Operations", "Suspicious activity detected on your account. Open a secure support session to verify your identity."),
    },

    "vertexlabs-support": {
        "id": "vertexlabs-support",
        "name": "Vertex Labs — Fake IT Support",
        "category": "Support / Technical",
        "scenario_type": "support",
        "difficulty": "Hard",
        "subject": "Vertex Labs IT: Your device security certificate has expired",
        "sender_name": "Vertex Labs IT Department",
        "sender_email_display": "it-support@vertexlabs-helpdesk.com",
        "fictional_org": "Vertex Labs IT",
        "manipulation": ["fear", "authority", "urgency"],
        "red_flags": ["helpdesk-specific domain", "certificate expiry claim", "remote session request implied"],
        "safe_action": "IT departments do not ask you to click email links to update security certificates — contact IT directly.",
        "lure_description": "Simulates an IT support scam claiming your device certificate has expired.",
        "generate_html": _make_support_html(
            "Vertex Labs IT",
            "Device Security Certificate Expired",
            "Begin Certificate Renewal"
        ),
        "generate_text": _text_generic("Vertex Labs IT Support", "Your device security certificate has expired. Begin renewal via the secure support portal."),
    },

    "bluewave-security": {
        "id": "bluewave-security",
        "name": "Bluewave — Security Warning",
        "category": "Support / Technical",
        "scenario_type": "support",
        "difficulty": "Medium",
        "subject": "Bluewave Security: Your account was accessed from an unknown location",
        "sender_name": "Bluewave Security Team",
        "sender_email_display": "security@bluewave-protect.net",
        "fictional_org": "Bluewave",
        "manipulation": ["fear", "urgency"],
        "red_flags": ["protect-specific domain", "unrecognised location claim", "account freeze threat"],
        "safe_action": "Review account security settings directly via the official Bluewave app.",
        "lure_description": "Simulates a security warning about account access from an unknown location.",
        "generate_html": _make_support_html(
            "Bluewave Security",
            "Account Accessed from Unknown Location",
            "Secure My Account Now"
        ),
        "generate_text": _text_generic("Bluewave Security Team", "Your Bluewave account was accessed from an unknown location. Secure your account immediately."),
    },

    # ── 7. HR / DOCUMENT ──────────────────────────────────────────────────────

    "hr-policy-update": {
        "id": "hr-policy-update",
        "name": "Northstar Systems HR — Policy Update",
        "category": "HR / Document",
        "scenario_type": "document",
        "difficulty": "Hard",
        "subject": "Mandatory Action: Review & acknowledge updated 2026 Remote Work Policy",
        "sender_name": "Human Resources Portal",
        "sender_email_display": "compliance@hr-internal-portal.org",
        "fictional_org": "Northstar Systems HR",
        "manipulation": ["authority", "urgency", "fear"],
        "red_flags": ["internal HR via external domain", "payroll hold threat", "e-signature via email link"],
        "safe_action": "HR policy sign-offs are done via the official intranet — never via email links.",
        "lure_description": "Simulates an internal HR compliance mandate requiring immediate acknowledgment to avoid payroll hold.",
        "generate_html": _make_hr_html("Northstar Systems", "Mandatory Policy Acknowledgment Required", "End of this week", "Review & Sign HR Document"),
        "generate_text": _text_generic("Northstar Systems HR", "Please review and sign the updated 2026 Remote Work Policy. Deadline: end of week."),
    },

    "vertex-payroll": {
        "id": "vertex-payroll",
        "name": "Vertex Labs HR — Payroll Update",
        "category": "HR / Document",
        "scenario_type": "document",
        "difficulty": "Hard",
        "subject": "Vertex Labs Payroll: Update your bank details before next pay run",
        "sender_name": "Vertex Labs Payroll Department",
        "sender_email_display": "payroll@vertexlabs-hr.com",
        "fictional_org": "Vertex Labs Payroll",
        "manipulation": ["authority", "urgency", "fear"],
        "red_flags": ["payroll requests via email link", "bank detail update request", "tight deadline"],
        "safe_action": "Bank detail changes must be submitted via the official HR system in person or through a verified portal.",
        "lure_description": "Simulates a payroll bank detail update request before a pay run.",
        "generate_html": _make_hr_html("Vertex Labs", "Payroll Bank Details Update Required", "48 hours", "Review & Sign Document"),
        "generate_text": _text_generic("Vertex Labs Payroll", "Update your bank details before the next pay run or your salary may be delayed."),
    },

    "bluewave-invoice": {
        "id": "bluewave-invoice",
        "name": "Bluewave Finance — Invoice Verification",
        "category": "HR / Document",
        "scenario_type": "document",
        "difficulty": "Medium",
        "subject": "Bluewave Finance: Invoice #BW-20261481 requires your approval",
        "sender_name": "Bluewave Finance Department",
        "sender_email_display": "invoices@bluewave-finance.net",
        "fictional_org": "Bluewave Finance",
        "manipulation": ["authority", "curiosity"],
        "red_flags": ["finance-specific domain", "invoice number creates legitimacy illusion", "approval via email link"],
        "safe_action": "Invoice approvals must be done via the official finance system — never via email links.",
        "lure_description": "Simulates an invoice approval request from a fake finance department.",
        "generate_html": _make_hr_html("Bluewave Finance", "Invoice #BW-20261481 — Approval Required", "End of business today", "Approve Invoice"),
        "generate_text": _text_generic("Bluewave Finance", "Invoice #BW-20261481 requires your approval. Please review and sign by end of business today."),
    },

    "cloudvault-identity": {
        "id": "cloudvault-identity",
        "name": "CloudVault Workplace — Identity Verification",
        "category": "HR / Document",
        "scenario_type": "document",
        "difficulty": "Hard",
        "subject": "CloudVault Workplace: Annual identity re-verification required by compliance",
        "sender_name": "CloudVault Workplace Compliance",
        "sender_email_display": "compliance@cloudvault-workplace.org",
        "fictional_org": "CloudVault Workplace",
        "manipulation": ["authority", "fear", "urgency"],
        "red_flags": ["compliance-specific domain", "annual re-verification via email", "account suspension threat"],
        "safe_action": "Identity re-verification is done via official HR portals — never submit documents via email links.",
        "lure_description": "Simulates a workplace annual identity re-verification request.",
        "generate_html": _make_hr_html("CloudVault Workplace", "Annual Identity Re-Verification Required", "72 hours", "Verify Identity"),
        "generate_text": _text_generic("CloudVault Workplace Compliance", "Annual identity re-verification is required for all employees. Complete within 72 hours to avoid account suspension."),
    },

}


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def get_template(template_id: str) -> Dict[str, Any]:
    return TEMPLATES.get(template_id, TEMPLATES["nordvault-security"])


def list_templates() -> List[Dict[str, Any]]:
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "category": t["category"],
            "scenario_type": t.get("scenario_type", "login"),
            "difficulty": t["difficulty"],
            "subject": t["subject"],
            "sender_name": t["sender_name"],
            "sender_email_display": t["sender_email_display"],
            "fictional_org": t.get("fictional_org", ""),
            "manipulation": t.get("manipulation", []),
            "red_flags": t.get("red_flags", []),
            "safe_action": t.get("safe_action", ""),
            "lure_description": t["lure_description"],
        }
        for t in TEMPLATES.values()
    ]
