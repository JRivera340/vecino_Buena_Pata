from datetime import datetime

from sqlalchemy import DateTime, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import TipoDocumentoEnum


class Persona(Base):
    """Persona natural que inscribe animales sin tener cuenta."""

    __tablename__ = "persona"
    __table_args__ = (UniqueConstraint("tipo_documento", "numero_documento", name="uq_persona_documento"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_documento: Mapped[TipoDocumentoEnum] = mapped_column()
    numero_documento: Mapped[str] = mapped_column(String(30))
    nombre: Mapped[str] = mapped_column(String(160))
    telefono: Mapped[str] = mapped_column(String(30))
    correo: Mapped[str] = mapped_column(String(160))
    barrio: Mapped[str] = mapped_column(String(120))
    aceptacion_datos_en: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
