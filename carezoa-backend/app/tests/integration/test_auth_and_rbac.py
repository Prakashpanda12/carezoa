"""Auth flows + RBAC enforcement (httpx against the real app)."""

import pytest

from app.core.config import get_settings

pytestmark = pytest.mark.asyncio

BASE = "/api/v1"


async def test_otp_request_and_verify_flow(client):
    res = await client.post(f"{BASE}/auth/otp/request", json={"phone": "+91 94370 00001"})
    assert res.status_code == 200
    body = res.json()
    assert body["dev_code"] == get_settings().dev_otp_code  # sandbox honors devCode

    res = await client.post(
        f"{BASE}/auth/otp/verify", json={"phone": "+919437000001", "code": body["dev_code"]}
    )
    assert res.status_code == 200
    tokens = res.json()
    assert tokens["access_token"]
    assert tokens["is_new_user"] is True

    me = await client.get(
        f"{BASE}/patients/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert me.status_code == 200


async def test_wrong_otp_rejected(client):
    await client.post(f"{BASE}/auth/otp/request", json={"phone": "+919437000002"})
    res = await client.post(
        f"{BASE}/auth/otp/verify", json={"phone": "+919437000002", "code": "999999"}
    )
    assert res.status_code == 401


async def test_rbac_blocks_non_admin_from_admin_routes(client):
    res = await client.post(f"{BASE}/auth/otp/request", json={"phone": "+919437000003"})
    verify = await client.post(
        f"{BASE}/auth/otp/verify", json={"phone": "+919437000003", "code": res.json()["dev_code"]}
    )
    token = verify.json()["access_token"]
    denied = await client.get(
        f"{BASE}/admin/flagged-events", headers={"Authorization": f"Bearer {token}"}
    )
    assert denied.status_code == 403


async def test_missing_token_rejected(client):
    res = await client.get(f"{BASE}/patients/me")
    assert res.status_code == 401
