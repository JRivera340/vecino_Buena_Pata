from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import CausalSalidaEnum, EspecieEnum, EstadoAnimalEnum, SexoEnum, TamanoEnum


class AnimalCrear(BaseModel):
    nombre: str
    especie: EspecieEnum = EspecieEnum.PERRO
    sexo: SexoEnum
    tamano: TamanoEnum
    edad_estimada: int | None = None
    descripcion: str | None = None
    foto_principal: str | None = None
    barrio: str
    latitud: float
    longitud: float
    comunidad_id: int


class AnimalSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    especie: EspecieEnum
    sexo: SexoEnum
    edad_estimada: int | None
    tamano: TamanoEnum
    descripcion: str | None
    foto_principal: str | None
    estado: EstadoAnimalEnum
    esterilizado: bool
    numero_microchip: str | None
    barrio: str
    localidad: str | None = None
    latitud: float
    longitud: float
    comunidad_id: int
    causal_salida: CausalSalidaEnum | None
    fecha_salida: datetime | None
    notas_salida: str | None
    fecha_inscripcion: datetime
    inscrito_por: str
