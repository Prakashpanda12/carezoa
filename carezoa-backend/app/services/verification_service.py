"""Provider verification: signed uploads, credential review, status recompute."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.provider import ProviderCredential, VerificationStatus
from app.repositories import provider_repository as providers
from app.services import notification_service


async def request_credential_upload(
    session: AsyncSession, *, provider_id: int, doc_type: str, storage
) -> tuple[ProviderCredential, str]:
    s3_key = f"credentials/{provider_id}/{doc_type}-{VerificationStatus.PENDING_REVIEW}.bin"
    credential = await providers.add_credential(
        session,
        ProviderCredential(provider_id=provider_id, doc_type=doc_type, s3_key=s3_key),
    )
    upload_url = storage.presign_put(s3_key)
    return credential, upload_url


async def review_credential(
    session: AsyncSession, *, credential: ProviderCredential, approve: bool
) -> Provider:
    credential.status = VerificationStatus.VERIFIED if approve else "rejected"
    provider = await providers.get_provider(session, credential.provider_id)
    if provider is None:
        raise NotFoundError("Provider not found")

    credentials = await providers.list_credentials(session, provider.id)
    provider.verification_status = (
        VerificationStatus.VERIFIED
        if credentials and all(c.status == VerificationStatus.VERIFIED for c in credentials)
        else VerificationStatus.PENDING_REVIEW
    )
    if provider.user_id:
        await notification_service.notify(
            session,
            user_id=provider.user_id,
            channel="push",
            template="credential_reviewed",
            payload={"doc_type": credential.doc_type, "approved": approve},
        )
    return provider
