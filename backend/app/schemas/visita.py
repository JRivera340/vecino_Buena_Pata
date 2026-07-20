from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import EstadoSaludEnum


class VisitaCrear(BaseModel):
    estado_salud: EstadoSaludEnum
    estado_comportamiento: str
    peso_kg: float | None = None
    foto: str | None = None
    observaciones: str | None = None


class VisitaSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    fecha: datetime
    responsable: str
    estado_salud: EstadoSaludEnum
    estado_comportamiento: str
    peso_kg: float | None
    foto: str | None
    observaciones: str | None
