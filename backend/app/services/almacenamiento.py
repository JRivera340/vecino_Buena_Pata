import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile


class AlmacenamientoLocal:
    def __init__(self, directorio: Path):
        self.directorio = directorio
        self.directorio.mkdir(parents=True, exist_ok=True)

    def guardar(self, archivo: UploadFile) -> str:
        extension = Path(archivo.filename or "").suffix or ".jpg"
        nombre = f"{uuid.uuid4().hex}{extension}"
        destino = self.directorio / nombre
        with destino.open("wb") as salida:
            shutil.copyfileobj(archivo.file, salida)
        return nombre
