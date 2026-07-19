from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class AtencionEspecial(Base):
    __tablename__ = "atencion_especial"

    id: Mapped[int] = mapped_column(primary_key=True)
    reporte_id: Mapped[int] = mapped_column(ForeignKey("reporte_novedad.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    responsable: Mapped[str] = mapped_column(String(120))
    acciones_realizadas: Mapped[str] = mapped_column(String(1000))
    resultado: Mapped[str] = mapped_column(String(1000))
