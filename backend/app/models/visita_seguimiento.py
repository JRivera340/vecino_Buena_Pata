from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import EstadoSaludEnum


class VisitaSeguimiento(Base):
    __tablename__ = "visita_seguimiento"

    id: Mapped[int] = mapped_column(primary_key=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animal.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    responsable: Mapped[str] = mapped_column(String(120))
    estado_salud: Mapped[EstadoSaludEnum] = mapped_column()
    estado_comportamiento: Mapped[str] = mapped_column(String(255))
    peso_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    foto: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(String(1000), nullable=True)
