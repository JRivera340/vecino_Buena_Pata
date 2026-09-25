from fastapi import APIRouter, Depends, UploadFile

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.schemas.media import MediaSubidaRespuesta
from app.services.almacenamiento import crear_almacenamiento

router = APIRouter(prefix="/media", tags=["media"])


@router.post("", response_model=MediaSubidaRespuesta, status_code=201)
async def subir_archivo(archivo: UploadFile, _=Depends(get_current_user)) -> MediaSubidaRespuesta:
    almacenamiento = crear_almacenamiento(get_settings())
    nombre = almacenamiento.guardar(archivo)
    return MediaSubidaRespuesta(ruta=nombre)
