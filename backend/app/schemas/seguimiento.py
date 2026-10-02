from datetime import datetime

from pydantic import BaseModel


class AnimalSeguimientoSchema(BaseModel):
    id: int
    nombre: str
    barrio: str
    comunidad_id: int | None
    latitud: float
    longitud: float
    estado_seguimiento: str
    visita_en_camino_por: str | None
    proxima_visita_vence: datetime
