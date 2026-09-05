"""Credential verification: signed uploads (provider) + review (admin)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_role
from app.core.exceptions import NotFoundError
from app.core.security import Role
from app.db.session import get_session
from app.integrations.storage import S3Storage
from app.models.user import User
from app.repositories import provider_repository as repo
from app.schemas.provider import CredentialUploadOut
from app.services import verification_service

router = APIRouter(tags=["verification"])
storage = S3Storage()


@router.post("/providers/me/credentials", response_model=CredentialUploadOut, status_code=201)
async def request_upload(
    payload: dict,
    user: User = Depends(require_role(Role.PROVIDER)),
    session: AsyncSession = Depends(get_session),
):
    provider = await repo.get_provider_for_user(session, user.id)
    if provider is None:
        raise NotFoundError("Provider profile not found")
    credential, upload_url = await verification_service.request_credential_upload(
        session,
        provider_id=provider.id,
        doc_type=str(payload.get("doc_type", "license")),
        storage=storage,
    )
    await session.commit()
    return CredentialUploadOut(
        credential_id=credential.id, upload_url=upload_url, expires_in_sec=900
    )


@router.post("/admin/credentials/{credential_id}/review")
async def review(
    credential_id: int,
    payload: dict,
    _: User = Depends(require_role(Role.ADMIN)),
    session: AsyncSession = Depends(get_session),
):
    from app.models.provider import ProviderCredential

    credential = await session.get(ProviderCredential, credential_id)
    if credential is None:
        raise NotFoundError("Credential not found")
    provider = await verification_service.review_credential(
        session, credential=credential, approve=bool(payload.get("approve"))
    )
    await session.commit()
    return {"provider_id": provider.id, "verification_status": provider.verification_status.value}
