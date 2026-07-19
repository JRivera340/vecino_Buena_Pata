from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class EventoHistorial(Base):
    __tablename__ = "evento_historial"

    id: Mapped[int] = mapped_column(primary_key=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animal.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    tipo_evento: Mapped[str] = mapped_column(String(60))
    usuario: Mapped[str] = mapped_column(String(120))
    detalle: Mapped[dict] = mapped_column(JSONB, default=dict)
