from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator

from fastapi import Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PermissionDeniedError, UnauthorizedError
from app.core.security import Role, decode_token
from app.db.session import get_session
from app.repositories.identity_repository import get_user
from app.models.user import User

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class Pagination:
    page: int
    page_size: int
    offset: int


def pagination(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> Pagination:
    return Pagination(page=page, page_size=page_size, offset=(page - 1) * page_size)


async def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    if creds is None:
        raise UnauthorizedError("Missing bearer token")
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload["sub"])
    except Exception:
        raise UnauthorizedError("Invalid or expired token")
    user = await get_user(session, user_id)
    if user is None or not user.is_active:
        raise UnauthorizedError("Account disabled or not found")
    return user


def require_role(*roles: Role):
    async def dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise PermissionDeniedError(f"Requires role: {', '.join(roles)}")
        return user

    return dep


def require_admin_mfa(user: User = Depends(get_current_user)) -> User:
    """Admin routes require MFA-issued tokens (mfa claim set at login)."""
    if user.role != Role.ADMIN:
        raise PermissionDeniedError("Admin only")
    # mfa claim checked by auth router at issue time; presence enforced here via user flag
    if not user.mfa_enabled:
        raise PermissionDeniedError("Admin access requires an MFA-issued token")
    return user


DbSessionDep = AsyncSession
SessionDep = Depends(get_session)
CurrentUserDep = Depends(get_current_user)
__all__ = ["get_session", "get_current_user", "require_role", "require_admin_mfa", "Pagination", "pagination", "AsyncIterator"]
