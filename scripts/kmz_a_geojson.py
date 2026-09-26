"""Convierte el KMZ de localidades de Bogota en los dos GeoJSON que usa el sistema.

Uso (desde la raiz del repositorio, con shapely instalado: pip install -e "backend[geo]"):

    python scripts/kmz_a_geojson.py "Localidades Bogota.kmz"

Genera:
  - backend/app/data/localidades.geojson   precision completa, para calcular la localidad de cada animal.
  - frontend/src/geo/localidades.geojson   simplificado, para dibujar en los mapas.

El KMZ solo trae el codigo de cada localidad (01 a 20) en <name>; el nombre sale de la tabla
NOMBRES y se contrasta con el nombre que viene dentro de la descripcion para detectar errores.
"""

import json
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from shapely.geometry import MultiPolygon, Polygon, mapping
from shapely.validation import make_valid

RAIZ = Path(__file__).resolve().parent.parent
SALIDA_COMPLETA = RAIZ / "backend" / "app" / "data" / "localidades.geojson"
SALIDA_WEB = RAIZ / "frontend" / "src" / "geo" / "localidades.geojson"

TOLERANCIA_WEB = 0.0001  # grados; unos 11 m, imperceptible al dibujar
DECIMALES_WEB = 5
DECIMALES_COMPLETO = 6
TAMANO_MAXIMO_WEB = 300 * 1024

NOMBRES = {
    "01": "Usaquén",
    "02": "Chapinero",
    "03": "Santa Fe",
    "04": "San Cristóbal",
    "05": "Usme",
    "06": "Tunjuelito",
    "07": "Bosa",
    "08": "Kennedy",
    "09": "Fontibón",
    "10": "Engativá",
    "11": "Suba",
    "12": "Barrios Unidos",
    "13": "Teusaquillo",
    "14": "Los Mártires",
    "15": "Antonio Nariño",
    "16": "Puente Aranda",
    "17": "La Candelaria",
    "18": "Rafael Uribe Uribe",
    "19": "Ciudad Bolívar",
    "20": "Sumapaz",
}

KML = "{http://www.opengis.net/kml/2.2}"


def _sin_tildes(texto: str) -> str:
    return re.sub(r"[^a-z]", "", unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower())


def _anillo(coordenadas: str) -> list[tuple[float, float]]:
    puntos = []
    for trozo in coordenadas.split():
        lon, lat, *_ = trozo.split(",")
        puntos.append((float(lon), float(lat)))
    return puntos


def _poligonos(placemark: ET.Element) -> list[Polygon]:
    resultado = []
    for poligono in placemark.iter(f"{KML}Polygon"):
        exterior = poligono.find(f"{KML}outerBoundaryIs/{KML}LinearRing/{KML}coordinates")
        huecos = [
            _anillo(h.text) for h in poligono.findall(f"{KML}innerBoundaryIs/{KML}LinearRing/{KML}coordinates")
        ]
        resultado.append(Polygon(_anillo(exterior.text), huecos))
    return resultado


def _nombre_en_descripcion(placemark: ET.Element) -> str | None:
    descripcion = placemark.findtext(f"{KML}description") or ""
    coincidencia = re.search(r"<td>([^<]+)</td>", descripcion)
    return coincidencia.group(1).strip() if coincidencia else None


def _redondear(geometria, decimales: int) -> dict:
    def redondeo(valor):
        if isinstance(valor, (list, tuple)):
            return [redondeo(v) for v in valor]
        return round(valor, decimales)

    datos = mapping(geometria)
    return {"type": datos["type"], "coordinates": redondeo(datos["coordinates"])}


def leer_localidades(ruta_kmz: Path) -> list[dict]:
    with zipfile.ZipFile(ruta_kmz) as kmz:
        nombre_kml = next(n for n in kmz.namelist() if n.endswith(".kml"))
        raiz = ET.fromstring(kmz.read(nombre_kml))

    localidades = []
    for placemark in raiz.iter(f"{KML}Placemark"):
        codigo = (placemark.findtext(f"{KML}name") or "").strip().zfill(2)
        if codigo not in NOMBRES:
            raise SystemExit(f"Codigo de localidad desconocido: {codigo!r}")
        en_archivo = _nombre_en_descripcion(placemark)
        # El KMZ omite el articulo ("CANDELARIA", "MARTIRES"), asi que basta con que uno contenga al otro.
        archivo, tabla = (_sin_tildes(en_archivo or ""), _sin_tildes(NOMBRES[codigo]))
        if en_archivo and archivo not in tabla and tabla not in archivo:
            raise SystemExit(f"El codigo {codigo} dice '{en_archivo}' en el KMZ y '{NOMBRES[codigo]}' en la tabla.")
        geometria = MultiPolygon(_poligonos(placemark))
        if not geometria.is_valid:
            geometria = make_valid(geometria)
        localidades.append({"codigo": codigo, "nombre": NOMBRES[codigo], "geometria": geometria})

    faltantes = sorted(set(NOMBRES) - {loc["codigo"] for loc in localidades})
    if faltantes:
        raise SystemExit(f"Faltan localidades en el KMZ: {faltantes}")
    return sorted(localidades, key=lambda loc: loc["codigo"])


def a_coleccion(localidades: list[dict], tolerancia: float | None, decimales: int) -> dict:
    features = []
    for loc in localidades:
        geometria = loc["geometria"]
        if tolerancia:
            geometria = geometria.simplify(tolerancia, preserve_topology=True)
        features.append(
            {
                "type": "Feature",
                "properties": {"codigo": loc["codigo"], "nombre": loc["nombre"]},
                "geometry": _redondear(geometria, decimales),
            }
        )
    return {"type": "FeatureCollection", "features": features}


def escribir(ruta: Path, coleccion: dict) -> int:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    texto = json.dumps(coleccion, ensure_ascii=False, separators=(",", ":"))
    ruta.write_text(texto, encoding="utf-8")
    return len(texto.encode("utf-8"))


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    localidades = leer_localidades(Path(sys.argv[1]))

    completo = escribir(SALIDA_COMPLETA, a_coleccion(localidades, None, DECIMALES_COMPLETO))
    web = escribir(SALIDA_WEB, a_coleccion(localidades, TOLERANCIA_WEB, DECIMALES_WEB))
    print(f"{len(localidades)} localidades.")
    print(f"Completo: {completo / 1024:.0f} KB en {SALIDA_COMPLETA.relative_to(RAIZ)}")
    print(f"Web: {web / 1024:.0f} KB en {SALIDA_WEB.relative_to(RAIZ)}")
    if web > TAMANO_MAXIMO_WEB:
        raise SystemExit(f"El archivo web pesa mas de {TAMANO_MAXIMO_WEB // 1024} KB: sube TOLERANCIA_WEB.")


if __name__ == "__main__":
    main()
