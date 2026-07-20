from pydantic import BaseModel

from app.models.enums import EstadoAnimalEnum


class FormalizacionRespuesta(BaseModel):
    animal_id: int
    estado: EstadoAnimalEnum
    codigo_collar: str
