import io

from fastapi import UploadFile

from app.services.almacenamiento import AlmacenamientoLocal


def test_guardar_archivo_crea_archivo_en_directorio(tmp_path):
    almacenamiento = AlmacenamientoLocal(tmp_path)
    contenido = io.BytesIO(b"contenido de prueba")
    archivo = UploadFile(filename="foto.jpg", file=contenido)

    nombre = almacenamiento.guardar(archivo)

    assert (tmp_path / nombre).exists()
    assert nombre.endswith(".jpg")
