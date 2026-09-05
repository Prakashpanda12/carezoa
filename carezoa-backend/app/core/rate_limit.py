from __future__ import annotations

import time
from dataclasses import dataclass, field

from fastapi import Request

from app.core.exceptions import RateLimitedError


@dataclass
class _Bucket:
    hits: list[float] = field(default_factory=list)


class SlidingWindowRateLimiter:
    """In-proc limiter for dev/tests; swap storage for Redis INCR+EXPIRE in prod."""

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self._buckets: dict[str, _Bucket] = {}

    def check(self, key: str) -> None:
        now = time.monotonic()
        bucket = self._buckets.setdefault(key, _Bucket())
        bucket.hits = [t for t in bucket.hits if now - t < self.window]
        if len(bucket.hits) >= self.limit:
            raise RateLimitedError(f"Too many requests for {key}")
        bucket.hits.append(now)


def rate_limit_dependency(limiter: SlidingWindowRateLimiter, bucket: str):
    async def dep(request: Request) -> None:
        client = request.client.host if request.client else "unknown"
        limiter.check(f"{bucket}:{client}")

    return dep
