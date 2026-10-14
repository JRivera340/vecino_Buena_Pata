from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import requiere_rol
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.schemas.importacion import ResumenImportacion
from app.services.importacion import importar_csv

router = APIRouter(prefix="/importacion", tags=["importacion"])


@router.post("/animales", response_model=ResumenImportacion)
async def importar_animales(
    archivo: UploadFile,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.ADMIN)),
) -> ResumenImportacion:
    if not archivo.filename or not archivo.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=422, detail="El archivo debe ser un .csv")
    contenido = await archivo.read()
    return importar_csv(db, contenido, inscrito_por=usuario.username)
