from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import EstadoReporteEnum


class ReporteSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    fecha: datetime
    reportante_nombre: str
    comunidad_id: int | None
    descripcion: str
    foto: str | None
    latitud: float | None
    longitud: float | None
    estado: EstadoReporteEnum


class AtencionCrear(BaseModel):
    acciones_realizadas: str
    resultado: str


class AtencionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reporte_id: int
    fecha: datetime
    responsable: str
    acciones_realizadas: str
    resultado: str
