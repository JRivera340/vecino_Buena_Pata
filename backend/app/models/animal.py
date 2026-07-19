from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import CausalSalidaEnum, EspecieEnum, EstadoAnimalEnum, SexoEnum, TamanoEnum


class Animal(Base):
    __tablename__ = "animal"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    especie: Mapped[EspecieEnum] = mapped_column(default=EspecieEnum.PERRO)
    sexo: Mapped[SexoEnum] = mapped_column()
    edad_estimada: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tamano: Mapped[TamanoEnum] = mapped_column()
    descripcion: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    foto_principal: Mapped[str | None] = mapped_column(String(255), nullable=True)

    estado: Mapped[EstadoAnimalEnum] = mapped_column(default=EstadoAnimalEnum.CANDIDATO)

    esterilizado: Mapped[bool] = mapped_column(Boolean, default=False)
    numero_microchip: Mapped[str | None] = mapped_column(String(60), nullable=True)

    barrio: Mapped[str] = mapped_column(String(120))
    latitud: Mapped[float] = mapped_column(Float)
    longitud: Mapped[float] = mapped_column(Float)

    comunidad_id: Mapped[int] = mapped_column(ForeignKey("comunidad.id"))

    causal_salida: Mapped[CausalSalidaEnum | None] = mapped_column(nullable=True)
    fecha_salida: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notas_salida: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    fecha_inscripcion: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    inscrito_por: Mapped[str] = mapped_column(String(120))
