from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import VeredictoValidacionEnum


class ValidacionCrear(BaseModel):
    veredicto: VeredictoValidacionEnum
    pendientes: list[str] = []
    observaciones: str | None = None
    esterilizado: bool | None = None
    numero_microchip: str | None = None


class ValidacionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    fecha: datetime
    veterinario: str
    veredicto: VeredictoValidacionEnum
    pendientes: list[str]
    observaciones: str | None
