import io
import uuid
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

_FORMATOS_LIMPIABLES = {"JPEG", "PNG", "WEBP"}
_METADATOS_A_QUITAR = ("exif", "xmp")


def _sin_metadatos(contenido: bytes) -> bytes | None:
    try:
        imagen = Image.open(io.BytesIO(contenido))
        formato = imagen.format
        if formato not in _FORMATOS_LIMPIABLES or getattr(imagen, "is_animated", False):
            return None
        imagen = ImageOps.exif_transpose(imagen)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        return None

    for clave in _METADATOS_A_QUITAR:
        imagen.info.pop(clave, None)
    salida = io.BytesIO()
    opciones = {"quality": 90} if formato == "JPEG" else {}
    imagen.save(salida, format=formato, **opciones)
    return salida.getvalue()


class AlmacenamientoLocal:
    def __init__(self, directorio: Path):
        self.directorio = directorio
        self.directorio.mkdir(parents=True, exist_ok=True)

    def guardar(self, archivo: UploadFile) -> str:
        extension = Path(archivo.filename or "").suffix or ".jpg"
        nombre = f"{uuid.uuid4().hex}{extension}"
        destino = self.directorio / nombre
        contenido = archivo.file.read()
        limpio = _sin_metadatos(contenido)
        destino.write_bytes(limpio if limpio is not None else contenido)
        return nombre
