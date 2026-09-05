from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "dev"
    app_name: str = "carezoa"
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"

    database_url: str = "postgresql+asyncpg://carezoa:carezoa@localhost:5432/carezoa"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_ttl_min: int = 30
    refresh_token_ttl_days: int = 30

    otp_ttl_min: int = 10
    otp_pepper: str = "change-me"
    dev_otp_code: str = "123456"  # only honored when app_env != prod

    payment_gateway: str = "sandbox"
    payment_webhook_secret: str = "whsec_change_me"
    telephony_provider: str = "mock"
    maps_provider: str = "haversine"

    s3_endpoint: str = "http://localhost:9000"
    s3_bucket: str = "carezoa-docs"
    s3_access_key: str = "minio"
    s3_secret_key: str = "minio123"
    s3_region: str = "ap-south-1"

    rate_limit_auth_per_min: int = 10
    rate_limit_otp_per_min: int = 5

    @property
    def is_prod(self) -> bool:
        return self.app_env == "prod"


@lru_cache
def get_settings() -> Settings:
    return Settings()
