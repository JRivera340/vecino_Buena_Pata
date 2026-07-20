from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import requiere_rol
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.models.validacion import Validacion
from app.schemas.validacion import ValidacionCrear, ValidacionSchema
from app.services.validacion import registrar_validacion

router = APIRouter(prefix="/animales/{animal_id}/validaciones", tags=["validaciones"])


@router.post("", response_model=ValidacionSchema, status_code=201)
def crear_validacion(
    animal_id: int,
    datos: ValidacionCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.VETERINARIO)),
) -> Validacion:
    try:
        return registrar_validacion(
            db,
            animal_id=animal_id,
            veterinario=usuario.username,
            veredicto=datos.veredicto,
            pendientes=datos.pendientes,
            observaciones=datos.observaciones,
            esterilizado=datos.esterilizado,
            numero_microchip=datos.numero_microchip,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
