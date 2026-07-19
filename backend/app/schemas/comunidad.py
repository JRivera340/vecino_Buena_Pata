from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import TipoComunidadEnum


class ComunidadCrear(BaseModel):
    nombre: str
    tipo: TipoComunidadEnum
    barrio: str
    telefono_contacto: str
    email_contacto: str


class ComunidadSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    tipo: TipoComunidadEnum
    barrio: str
    telefono_contacto: str
    email_contacto: str
    activa: bool
    fecha_registro: datetime
