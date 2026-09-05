"""
Test fixtures: async SQLite (aiosqlite) session + FastAPI test client.

Integration tests (auth, RBAC, payment webhook) run against the real app
factory with an in-file SQLite database; Postgres-only column types (JSONB)
are compiled to JSON on SQLite by SQLAlchemy.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_session


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture()
async def session_factory(tmp_path) -> AsyncGenerator:
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path}/test.db")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    yield factory
    await engine.dispose()


@pytest.fixture()
async def client(session_factory) -> AsyncGenerator[AsyncClient, None]:
    from app.main import create_app

    app = create_app()

    async def override_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


def sign(payload: dict) -> tuple[bytes, str]:
    settings = get_settings()
    raw = json.dumps(payload, separators=(",", ":")).encode()
    digest = hmac.new(settings.payment_webhook_secret.encode(), raw, hashlib.sha256).hexdigest()
    return raw, digest
