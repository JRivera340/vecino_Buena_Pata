from datetime import datetime

from pydantic import BaseModel

from app.models.enums import CausalSalidaEnum


class SalidaCrear(BaseModel):
    causal: CausalSalidaEnum
    fecha: datetime
    notas: str | None = None
