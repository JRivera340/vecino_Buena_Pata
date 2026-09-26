"""Localidad de Bogota a la que pertenece un punto.

Usa el GeoJSON de precision completa (app/data/localidades.geojson, generado con
scripts/kmz_a_geojson.py). Es un punto en poligono por rayos con un filtro previo por caja
envolvente: no hace falta ninguna libreria geoespacial en el servidor.
"""

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

ARCHIVO = Path(__file__).resolve().parent.parent / "data" / "localidades.geojson"

Anillo = list[tuple[float, float]]  # (longitud, latitud)


@dataclass(frozen=True)
class Poligono:
    exterior: Anillo
    huecos: list[Anillo]
    caja: tuple[float, float, float, float]  # min_lon, min_lat, max_lon, max_lat


@dataclass(frozen=True)
class Localidad:
    codigo: str
    nombre: str
    poligonos: list[Poligono]


def _anillo(coordenadas: list[list[float]]) -> Anillo:
    return [(punto[0], punto[1]) for punto in coordenadas]


def _poligono(anillos: list[list[list[float]]]) -> Poligono:
    exterior = _anillo(anillos[0])
    longitudes = [p[0] for p in exterior]
    latitudes = [p[1] for p in exterior]
    return Poligono(
        exterior=exterior,
        huecos=[_anillo(a) for a in anillos[1:]],
        caja=(min(longitudes), min(latitudes), max(longitudes), max(latitudes)),
    )


def cargar_localidades(ruta: Path = ARCHIVO) -> list[Localidad]:
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    localidades = []
    for feature in datos["features"]:
        geometria = feature["geometry"]
        poligonos = geometria["coordinates"] if geometria["type"] == "MultiPolygon" else [geometria["coordinates"]]
        localidades.append(
            Localidad(
                codigo=feature["properties"]["codigo"],
                nombre=feature["properties"]["nombre"],
                poligonos=[_poligono(p) for p in poligonos],
            )
        )
    return localidades


@lru_cache
def _localidades() -> list[Localidad]:
    return cargar_localidades()


def _dentro_del_anillo(longitud: float, latitud: float, anillo: Anillo) -> bool:
    dentro = False
    anterior = anillo[-1]
    for actual in anillo:
        (x1, y1), (x2, y2) = anterior, actual
        if (y1 > latitud) != (y2 > latitud):
            corte = (x2 - x1) * (latitud - y1) / (y2 - y1) + x1
            if longitud < corte:
                dentro = not dentro
        anterior = actual
    return dentro


def _dentro_del_poligono(longitud: float, latitud: float, poligono: Poligono) -> bool:
    min_lon, min_lat, max_lon, max_lat = poligono.caja
    if not (min_lon <= longitud <= max_lon and min_lat <= latitud <= max_lat):
        return False
    if not _dentro_del_anillo(longitud, latitud, poligono.exterior):
        return False
    return not any(_dentro_del_anillo(longitud, latitud, hueco) for hueco in poligono.huecos)


def localidad_de_punto(latitud: float, longitud: float, localidades: list[Localidad] | None = None) -> str | None:
    """Nombre de la localidad que contiene el punto, o None si cae fuera de Bogota."""
    for localidad in localidades if localidades is not None else _localidades():
        if any(_dentro_del_poligono(longitud, latitud, poligono) for poligono in localidad.poligonos):
            return localidad.nombre
    return None
