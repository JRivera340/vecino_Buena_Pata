from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import EspecieEnum, EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoComunidadEnum, TipoDocumentoEnum


class VerificarInscriptorSolicitud(BaseModel):
    tipo_documento: TipoDocumentoEnum
    numero_documento: str


class AnimalDeInscriptorSchema(BaseModel):
    """Lo que ve quien consulta por documento. Sin coordenadas exactas, sin codigo de collar
    y sin numero de microchip."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    especie: EspecieEnum
    sexo: SexoEnum
    tamano: TamanoEnum
    edad_estimada: int | None
    descripcion: str | None
    foto_principal: str | None
    estado: EstadoAnimalEnum
    esterilizado: bool
    tiene_microchip: bool
    barrio: str
    localidad: str | None = None
    fecha_inscripcion: datetime


class VerificarInscriptorRespuesta(BaseModel):
    total: int
    animales: list[AnimalDeInscriptorSchema]


class ComunidadPublicaSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    tipo: TipoComunidadEnum
    barrio: str


class InscripcionPublicaRespuesta(BaseModel):
    animal_id: int
    radicado: str
    nombre: str
    estado: EstadoAnimalEnum
