from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class NotificacionInterna(Base):
    __tablename__ = "notificacion_interna"

    id: Mapped[int] = mapped_column(primary_key=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animal.id"), index=True)
    origen_tipo: Mapped[str] = mapped_column(String(30))
    origen_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuario.id"), nullable=True, index=True)
    rol: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    leida_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
