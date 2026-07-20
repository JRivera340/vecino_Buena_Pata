from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import EspecieEnum, EstadoAnimalEnum, EstadoReporteEnum, SexoEnum, TamanoEnum


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
    latitud: float
    longitud: float
    fecha_inscripcion: datetime


class ReporteNovedadCrear(BaseModel):
    reportante_nombre: str
    descripcion: str
    foto: str | None = None
    latitud: float | None = None
    longitud: float | None = None


class ReporteNovedadRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    fecha: datetime
    estado: EstadoReporteEnum
