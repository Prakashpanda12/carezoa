"""Notification channel adapters (SMS/WhatsApp/push) with a logging sandbox sender."""

from __future__ import annotations

from typing import Protocol

from app.core.logging import get_logger

log = get_logger(__name__)


class NotificationSender(Protocol):
    channel: str

    def send(self, *, to_user_id: int, template: str, payload: dict) -> str: ...


class LoggingSender:
    """Sandbox: renders the message and logs it (no PII payloads — scrubbed upstream)."""

    def __init__(self, channel: str):
        self.channel = channel

    def send(self, *, to_user_id: int, template: str, payload: dict) -> str:
        preview = template
        for key, value in payload.items():
            preview = preview.replace("{{" + key + "}}", str(value))
        log.info("notification_sent", channel=self.channel, user_id=to_user_id, template=template)
        return f"{self.channel}:{template}:ok"


SENDERS = {
    "sms": LoggingSender("sms"),
    "whatsapp": LoggingSender("whatsapp"),
    "push": LoggingSender("push"),
}
