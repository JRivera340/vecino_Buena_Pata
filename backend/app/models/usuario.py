from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import RolUsuarioEnum, TipoDocumentoEnum


class Usuario(Base):
    __tablename__ = "usuario"
    __table_args__ = (UniqueConstraint("tipo_documento", "numero_documento", name="uq_usuario_documento"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    rol: Mapped[RolUsuarioEnum] = mapped_column()
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    tipo_documento: Mapped[TipoDocumentoEnum | None] = mapped_column(nullable=True)
    numero_documento: Mapped[str | None] = mapped_column(String(30), nullable=True)
