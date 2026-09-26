from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    EspecieEnum,
    EstadoAnimalEnum,
    EstadoReporteEnum,
    EstadoSaludEnum,
    SexoEnum,
    TamanoEnum,
)


class AnimalPublicoSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    especie: EspecieEnum
    sexo: SexoEnum
    tamano: TamanoEnum
    descripcion: str | None
    foto_principal: str | None
    estado: EstadoAnimalEnum
    barrio: str
    fecha_inscripcion: datetime


class AnimalMapaPublicoSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    especie: EspecieEnum
    foto_principal: str | None
    barrio: str
    localidad: str | None = None
    latitud: float
    longitud: float


class UltimaVisitaPublicaSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fecha: datetime
    estado_salud: EstadoSaludEnum
    peso_kg: float | None


class HojaVidaPublicaSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    especie: EspecieEnum
    sexo: SexoEnum
    tamano: TamanoEnum
    edad_estimada: int | None
    descripcion: str | None
    foto_principal: str | None
    barrio: str
    localidad: str | None = None
    fecha_inscripcion: datetime
    esterilizado: bool
    tiene_microchip: bool
    ultima_visita: UltimaVisitaPublicaSchema | None


class ReporteNovedadCrear(BaseModel):
    reportante_nombre: str = Field(max_length=120)
    descripcion: str = Field(max_length=1000)
    foto: str | None = Field(default=None, max_length=255)
    latitud: float | None = None
    longitud: float | None = None


class ReporteNovedadRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    fecha: datetime
    estado: EstadoReporteEnum
