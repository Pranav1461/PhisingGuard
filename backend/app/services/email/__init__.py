from backend.app.services.email.dispatcher import email_dispatcher
from backend.app.services.email.templates import TEMPLATES, get_template

__all__ = ["email_dispatcher", "TEMPLATES", "get_template"]
