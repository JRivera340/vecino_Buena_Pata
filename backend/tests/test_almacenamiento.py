import io

from fastapi import UploadFile
from PIL import Image
from PIL.TiffImagePlugin import IFDRational

from app.services.almacenamiento import AlmacenamientoLocal

_ETIQUETA_GPS = 0x8825
_ETIQUETA_MARCA = 0x010F
_ETIQUETA_ORIENTACION = 0x0112


def _jpeg_con_gps(tamano=(8, 8), orientacion=None) -> bytes:
    imagen = Image.new("RGB", tamano, "white")
    exif = Image.Exif()
    exif[_ETIQUETA_MARCA] = "MarcaDePrueba"
    if orientacion is not None:
        exif[_ETIQUETA_ORIENTACION] = orientacion
    gps = exif.get_ifd(_ETIQUETA_GPS)
    gps[1] = "N"
    gps[2] = (IFDRational(4, 1), IFDRational(36, 1), IFDRational(0, 1))
    gps[3] = "W"
    gps[4] = (IFDRational(74, 1), IFDRational(4, 1), IFDRational(0, 1))
    salida = io.BytesIO()
    imagen.save(salida, format="JPEG", exif=exif)
    return salida.getvalue()


def test_guardar_archivo_crea_archivo_en_directorio(tmp_path):
    almacenamiento = AlmacenamientoLocal(tmp_path)
    contenido = io.BytesIO(b"contenido de prueba")
    archivo = UploadFile(filename="foto.jpg", file=contenido)

    nombre = almacenamiento.guardar(archivo)

    assert (tmp_path / nombre).exists()
    assert nombre.endswith(".jpg")


def test_guardar_un_archivo_que_no_es_imagen_lo_conserva_sin_cambios(tmp_path):
    almacenamiento = AlmacenamientoLocal(tmp_path)
    archivo = UploadFile(filename="foto.jpg", file=io.BytesIO(b"contenido de prueba"))

    nombre = almacenamiento.guardar(archivo)

    assert (tmp_path / nombre).read_bytes() == b"contenido de prueba"


def test_guardar_una_foto_quita_la_ubicacion_gps_del_exif(tmp_path):
    contenido = _jpeg_con_gps()
    assert Image.open(io.BytesIO(contenido)).getexif().get_ifd(_ETIQUETA_GPS), "la foto de prueba debe traer GPS"
    almacenamiento = AlmacenamientoLocal(tmp_path)

    nombre = almacenamiento.guardar(UploadFile(filename="foto.jpg", file=io.BytesIO(contenido)))

    guardada = Image.open(tmp_path / nombre)
    exif = guardada.getexif()
    assert not exif.get_ifd(_ETIQUETA_GPS)
    assert _ETIQUETA_MARCA not in exif
    assert guardada.size == (8, 8)


def test_guardar_una_foto_aplica_la_orientacion_antes_de_quitar_el_exif(tmp_path):
    contenido = _jpeg_con_gps(tamano=(8, 4), orientacion=6)
    almacenamiento = AlmacenamientoLocal(tmp_path)

    nombre = almacenamiento.guardar(UploadFile(filename="foto.jpg", file=io.BytesIO(contenido)))

    guardada = Image.open(tmp_path / nombre)
    assert guardada.size == (4, 8)
    assert _ETIQUETA_ORIENTACION not in guardada.getexif()


def test_guardar_una_foto_png_sigue_siendo_una_imagen_valida(tmp_path):
    origen = io.BytesIO()
    Image.new("RGB", (6, 6), "red").save(origen, format="PNG")
    almacenamiento = AlmacenamientoLocal(tmp_path)

    nombre = almacenamiento.guardar(UploadFile(filename="foto.png", file=io.BytesIO(origen.getvalue())))

    guardada = Image.open(tmp_path / nombre)
    assert guardada.format == "PNG"
    assert guardada.size == (6, 6)
