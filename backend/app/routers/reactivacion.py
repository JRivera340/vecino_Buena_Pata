from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import requiere_rol
from app.models.animal import Animal
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.schemas.animal import AnimalSchema
from app.schemas.reactivacion import ReactivacionCrear
from app.services.reactivacion import reactivar_perdido

router = APIRouter(prefix="/animales/{animal_id}/reactivacion", tags=["reactivacion"])


@router.post("", response_model=AnimalSchema, status_code=201)
def crear_reactivacion(
    animal_id: int,
    datos: ReactivacionCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.VETERINARIO, RolUsuarioEnum.ADMIN)),
) -> Animal:
    try:
        return reactivar_perdido(
            db,
            animal_id=animal_id,
            veterinario=usuario.username,
            estado_salud=datos.estado_salud,
            estado_comportamiento=datos.estado_comportamiento,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
