from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import RolUsuarioEnum


class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    rol: Mapped[RolUsuarioEnum] = mapped_column()
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
