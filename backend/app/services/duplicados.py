import math
import unicodedata
from difflib import SequenceMatcher

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.enums import EspecieEnum

RADIO_DUPLICADO_M = 150
UMBRAL_NOMBRE = 0.8
_METROS_POR_GRADO = 111_320


def normalizar_nombre(nombre: str) -> str:
    sin_tildes = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode("ascii")
    return " ".join(sin_tildes.lower().split())


def nombres_parecidos(a: str, b: str) -> bool:
    return SequenceMatcher(None, normalizar_nombre(a), normalizar_nombre(b)).ratio() >= UMBRAL_NOMBRE


def distancia_m(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    radio_tierra = 6_371_000
    fi_a, fi_b = math.radians(lat_a), math.radians(lat_b)
    delta_fi = fi_b - fi_a
    delta_lambda = math.radians(lon_b - lon_a)
    h = math.sin(delta_fi / 2) ** 2 + math.cos(fi_a) * math.cos(fi_b) * math.sin(delta_lambda / 2) ** 2
    return 2 * radio_tierra * math.asin(math.sqrt(h))


def buscar_posible_duplicado(
    db: Session, especie: EspecieEnum, nombre: str, latitud: float, longitud: float
) -> Animal | None:
    """Animal de la misma especie, con nombre parecido, a menos de RADIO_DUPLICADO_M metros."""
    margen_lat = RADIO_DUPLICADO_M / _METROS_POR_GRADO
    margen_lon = margen_lat / max(math.cos(math.radians(latitud)), 0.01)
    candidatos = (
        db.query(Animal)
        .filter(
            Animal.especie == especie,
            Animal.latitud.between(latitud - margen_lat, latitud + margen_lat),
            Animal.longitud.between(longitud - margen_lon, longitud + margen_lon),
        )
        .order_by(Animal.id)
        .all()
    )
    for candidato in candidatos:
        if (
            distancia_m(latitud, longitud, candidato.latitud, candidato.longitud) <= RADIO_DUPLICADO_M
            and nombres_parecidos(nombre, candidato.nombre)
        ):
            return candidato
    return None
