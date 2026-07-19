from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class CollarQr(Base):
    __tablename__ = "collar_qr"

    id: Mapped[int] = mapped_column(primary_key=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animal.id"), unique=True)
    codigo: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    fecha_entrega: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
