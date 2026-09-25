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


_TIPOS_CONTENIDO = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def _preparar(archivo: UploadFile) -> tuple[str, str, bytes]:
    extension = Path(archivo.filename or "").suffix.lower() or ".jpg"
    nombre = f"{uuid.uuid4().hex}{extension}"
    contenido = archivo.file.read()
    limpio = _sin_metadatos(contenido)
    return nombre, extension, limpio if limpio is not None else contenido


class AlmacenamientoLocal:
    def __init__(self, directorio: Path):
        self.directorio = directorio
        self.directorio.mkdir(parents=True, exist_ok=True)

    def guardar(self, archivo: UploadFile) -> str:
        nombre, _, contenido = _preparar(archivo)
        (self.directorio / nombre).write_bytes(contenido)
        return nombre


class AlmacenamientoR2:
    """Guarda las fotos en un bucket de Cloudflare R2 (compatible con S3)."""

    def __init__(self, cliente, bucket: str):
        self.cliente = cliente
        self.bucket = bucket

    def guardar(self, archivo: UploadFile) -> str:
        nombre, extension, contenido = _preparar(archivo)
        self.cliente.put_object(
            Bucket=self.bucket,
            Key=nombre,
            Body=contenido,
            ContentType=_TIPOS_CONTENIDO.get(extension, "application/octet-stream"),
            CacheControl="public, max-age=31536000, immutable",
        )
        return nombre


def crear_almacenamiento(settings):
    if not settings.r2_configurado():
        return AlmacenamientoLocal(settings.media_root)

    import boto3

    cliente = boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )
    return AlmacenamientoR2(cliente, settings.r2_bucket)
