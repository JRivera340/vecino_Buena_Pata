from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Notificacion(Base):
    """Un correo que el sistema debe enviar por una inscripcion, con el resultado de cada intento."""

    __tablename__ = "notificacion"

    id: Mapped[int] = mapped_column(primary_key=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animal.id"), index=True)
    destinatario: Mapped[str] = mapped_column(String(160))
    tipo: Mapped[str] = mapped_column(String(40))
    estado: Mapped[str] = mapped_column(String(20), default="pendiente")
    intentos: Mapped[int] = mapped_column(Integer, default=0)
    ultimo_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    enviada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
