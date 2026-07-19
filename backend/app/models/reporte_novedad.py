from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import EstadoReporteEnum


class ReporteNovedad(Base):
    __tablename__ = "reporte_novedad"

    id: Mapped[int] = mapped_column(primary_key=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animal.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reportante_nombre: Mapped[str] = mapped_column(String(120))
    comunidad_id: Mapped[int | None] = mapped_column(ForeignKey("comunidad.id"), nullable=True)
    descripcion: Mapped[str] = mapped_column(String(1000))
    foto: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitud: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitud: Mapped[float | None] = mapped_column(Float, nullable=True)
    estado: Mapped[EstadoReporteEnum] = mapped_column(default=EstadoReporteEnum.NUEVO)
