import logging
import sys

import structlog

from app.core.config import get_settings

# Never put PII (phone, OTP, addresses, document payloads) into log lines;
# scrub processors drop well-known keys instead.
_PII_KEYS = {"phone", "otp", "code", "password", "address", "document", "token"}


def _strip_pii(_: logging.Logger, __: str, event_dict: dict) -> dict:
    for key in list(event_dict):
        if key.lower() in _PII_KEYS:
            event_dict[key] = "[redacted]"
    return event_dict


def configure_logging() -> None:
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=level)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            _strip_pii,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer()
            if settings.app_env == "dev"
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
