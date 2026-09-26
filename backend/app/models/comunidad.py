from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import TipoComunidadEnum


class Comunidad(Base):
    __tablename__ = "comunidad"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(160))
    tipo: Mapped[TipoComunidadEnum] = mapped_column()
    barrio: Mapped[str] = mapped_column(String(120))
    telefono_contacto: Mapped[str] = mapped_column(String(30))
    email_contacto: Mapped[str] = mapped_column(String(160))
    activa: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    lider_id: Mapped[int | None] = mapped_column(ForeignKey("usuario.id"), nullable=True)
