from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RolUsuarioEnum, TipoDocumentoEnum
from app.schemas.comunidad import ComunidadCrear


class UsuarioCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    username: str = Field(min_length=3, max_length=60, pattern=r"^[a-z0-9._-]+$")
    password: str = Field(min_length=8, max_length=72)
    rol: RolUsuarioEnum
    tipo_documento: TipoDocumentoEnum | None = None
    numero_documento: str | None = None
    # Un lider representa a una comunidad: se elige una existente o se crea una nueva.
    comunidad_id: int | None = None
    comunidad_nueva: ComunidadCrear | None = None


class UsuarioEditar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=120)
    tipo_documento: TipoDocumentoEnum | None = None
    numero_documento: str | None = None
    password: str | None = Field(default=None, min_length=8, max_length=72)


class UsuarioSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    username: str
    rol: RolUsuarioEnum
    tipo_documento: TipoDocumentoEnum | None
    numero_documento: str | None
    comunidad_id: int | None = None
    comunidad_nombre: str | None = None
