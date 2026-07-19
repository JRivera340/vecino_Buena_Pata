from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import VeredictoValidacionEnum


class Validacion(Base):
    __tablename__ = "validacion"

    id: Mapped[int] = mapped_column(primary_key=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animal.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    veterinario: Mapped[str] = mapped_column(String(120))
    veredicto: Mapped[VeredictoValidacionEnum] = mapped_column()
    pendientes: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    observaciones: Mapped[str | None] = mapped_column(String(1000), nullable=True)
