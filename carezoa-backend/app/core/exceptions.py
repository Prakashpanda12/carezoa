from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class DomainError(Exception):
    """Base for all business-rule failures. Maps cleanly onto HTTP."""

    status_code: int = 400
    code: str = "domain_error"

    def __init__(self, message: str | None = None):
        self.message = message or self.code
        super().__init__(self.message)


class NotFoundError(DomainError):
    status_code = 404
    code = "not_found"


class PermissionDeniedError(DomainError):
    status_code = 403
    code = "forbidden"


class UnauthorizedError(DomainError):
    status_code = 401
    code = "unauthorized"


class ConflictError(DomainError):
    status_code = 409
    code = "conflict"


class RateLimitedError(DomainError):
    status_code = 429
    code = "rate_limited"


class InvalidTransitionError(DomainError):
    status_code = 409
    code = "invalid_transition"


class GuardFailedError(DomainError):
    status_code = 409
    code = "transition_guard_failed"


class OtpMismatchError(DomainError):
    status_code = 401
    code = "otp_mismatch"


class ErrorBody(BaseModel):
    error: str
    code: str


async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    body = ErrorBody(error=exc.message, code=exc.code)
    return JSONResponse(status_code=exc.status_code, content=body.model_dump())


async def unexpected_error_handler(_: Request, exc: Exception) -> JSONResponse:
    body = ErrorBody(error="internal_error", code="internal_error")
    return JSONResponse(status_code=500, content=body.model_dump())
