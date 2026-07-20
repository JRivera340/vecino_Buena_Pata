from pydantic import BaseModel

from app.models.enums import EstadoSaludEnum


class ReactivacionCrear(BaseModel):
    estado_salud: EstadoSaludEnum
    estado_comportamiento: str
