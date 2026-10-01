from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificacionInternaSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    origen_tipo: str
    origen_id: int | None
    creada_en: datetime
    leida_en: datetime | None
