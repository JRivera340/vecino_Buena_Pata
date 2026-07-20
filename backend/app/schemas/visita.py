from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import EstadoSaludEnum


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
