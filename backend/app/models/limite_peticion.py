from datetime import datetime

from sqlalchemy import DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class LimitePeticion(Base):
    """Una fila por peticion contada. Sirve de contador compartido entre los workers."""

    __tablename__ = "limite_peticion"
    __table_args__ = (Index("ix_limite_peticion_clave_creada", "clave", "creada_en"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    clave: Mapped[str] = mapped_column(String(160))
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True))
