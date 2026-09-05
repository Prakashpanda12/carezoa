"""
Anti-bypass engine — pure stdlib.

Scans communication events for contact-sharing / off-platform-payment patterns.
Policy is FLAG FOR SUPPORT REVIEW, never silent block; stored bodies are also
scrubbed as defense-in-depth so leaked contact data never reaches the counterparty.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

MASK = "[hidden by CAREZOA]"

_PATTERNS: list[tuple[str, re.Pattern[str], float]] = [
    ("phone_number", re.compile(r"\+?\d[\d\s().-]{8,}\d"), 0.6),
    ("upi_or_payment", re.compile(r"\b[\w.-]{1,}@(ok[\w]*|ybl|paytm|upi|axl|ibl|sbi|hdfc)\b", re.I), 0.6),
    ("email", re.compile(r"[\w.+-]+@[\w-]+\.\w{2,}"), 0.5),
    ("social_handle", re.compile(r"\b(whatsapp|telegram|instagram|insta|signal|snapchat)\b", re.I), 0.4),
    ("direct_payment", re.compile(r"\b(cash|gpay|phonepe|paytm)\b.{0,25}\b(directly|direct|outside|offline)\b", re.I), 0.4),
]

_HIGH_AT = 0.8
_MEDIUM_AT = 0.4


@dataclass(frozen=True)
class ScanResult:
    flagged: bool
    severity: str | None  # "low" | "medium" | "high" | None
    score: float
    patterns: list[str] = field(default_factory=list)
    scrubbed: str = ""


def scan_message(text: str) -> ScanResult:
    patterns: list[str] = []
    score = 0.0
    scrubbed = text
    for name, pattern, weight in _PATTERNS:
        if pattern.search(scrubbed):
            patterns.append(name)
            score += weight
            scrubbed = pattern.sub(MASK, scrubbed)

    if not patterns:
        return ScanResult(flagged=False, severity=None, score=0.0, patterns=[], scrubbed=text)

    if score >= _HIGH_AT:
        severity = "high"
    elif score >= _MEDIUM_AT:
        severity = "medium"
    else:
        severity = "low"
    return ScanResult(
        flagged=True,
        severity=severity,
        score=round(score, 3),
        patterns=patterns,
        scrubbed=scrubbed,
    )


def scrub_text(text: str) -> str:
    """Convenience for contexts that only need scrubbing (e.g., service reports)."""
    return scan_message(text).scrubbed if scan_message(text).flagged else text
