from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import requiere_rol
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.schemas.formalizacion import FormalizacionRespuesta
from app.services.formalizacion import formalizar_vbp

router = APIRouter(prefix="/animales/{animal_id}/formalizacion", tags=["formalizacion"])


@router.post("", response_model=FormalizacionRespuesta, status_code=201)
def crear_formalizacion(
    animal_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.LIDER)),
) -> FormalizacionRespuesta:
    try:
        animal, collar = formalizar_vbp(db, animal_id=animal_id, lider=usuario.username)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return FormalizacionRespuesta(animal_id=animal.id, estado=animal.estado, codigo_collar=collar.codigo)
