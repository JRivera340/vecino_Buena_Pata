from pydantic import BaseModel

from app.models.enums import RolUsuarioEnum


class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    rol: RolUsuarioEnum
    nombre: str
