from datetime import date

from pydantic import BaseModel


class IndicadorLocalidad(BaseModel):
    codigo: str
    nombre: str
    total: int
    por_estado: dict[str, int]
    inscripciones_periodo: int
    reportes: int
    reportes_abiertos: int


class InscripcionesDelMes(BaseModel):
    mes: str
    santa_fe: int
    otras: int
    total: int


class Difusion(BaseModel):
    total_inscripciones: int
    en_santa_fe: int
    fuera_de_santa_fe: int
    sin_localidad: int
    # Porcentaje (0 a 100) de las inscripciones que son de localidades distintas de Santa Fe.
    peso_fuera_de_santa_fe: float
    mensual: list[InscripcionesDelMes]


class IndicadoresLocalidades(BaseModel):
    desde: date | None
    hasta: date | None
    total_animales: int
    sin_localidad: int
    localidades: list[IndicadorLocalidad]
    difusion: Difusion
