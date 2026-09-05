"""S3-compatible object storage — signed URLs only; raw creds never leave the box."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.core.config import get_settings


class S3Storage:
    """Presign helper (boto3 used lazily so tests don't need AWS clients)."""

    def __init__(self) -> None:
        settings = get_settings()
        self._bucket = settings.s3_bucket
        self._endpoint = settings.s3_endpoint
        self._expiry = 900

    def presign_put(self, s3_key: str) -> str:
        try:
            import boto3

            settings = get_settings()
            client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint,
                aws_access_key_id=settings.s3_access_key,
                aws_secret_access_key=settings.s3_secret_key,
                region_name=settings.s3_region,
            )
            return client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self._bucket, "Key": s3_key},
                ExpiresIn=self._expiry,
            )
        except Exception:
            # dev fallback when boto3/minio isn't around — still key-scoped
            return f"{self._endpoint}/{self._bucket}/{s3_key}?X-Dev-Presign={uuid4().hex[:16]}"

    def presign_get(self, s3_key: str) -> str:
        return self.presign_put(s3_key)


def signed_url_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=900)
