from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EventoHistorialSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    fecha: datetime
    tipo_evento: str
    usuario: str
    detalle: dict
