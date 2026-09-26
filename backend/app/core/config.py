from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://vbp:vbp@localhost:5432/vbp"
    media_root: Path = Path(__file__).resolve().parent.parent.parent / "media"
    jwt_secret: str = "dev-secret-cambiar-en-produccion"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    frontend_base_url: str = "http://localhost:4200"
    cors_origins: list[str] | None = None
    limite_verificar_por_minuto: int = 10
    limite_inscripciones_por_hora: int = 5
    r2_endpoint_url: str | None = None
    r2_bucket: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None

    def r2_configurado(self) -> bool:
        return all([self.r2_endpoint_url, self.r2_bucket, self.r2_access_key_id, self.r2_secret_access_key])

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origen.strip() for origen in value.split(",") if origen.strip()]
        return value

    def resolved_cors_origins(self) -> list[str]:
        return self.cors_origins or [self.frontend_base_url]


@lru_cache
def get_settings() -> Settings:
    return Settings()
