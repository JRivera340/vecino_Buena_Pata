from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import requiere_rol
from app.models.animal import Animal
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.schemas.animal import AnimalSchema
from app.schemas.salida import SalidaCrear
from app.services.salida import registrar_salida

router = APIRouter(prefix="/animales/{animal_id}/salida", tags=["salida"])


@router.post("", response_model=AnimalSchema, status_code=201)
def crear_salida(
    animal_id: int,
    datos: SalidaCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        requiere_rol(RolUsuarioEnum.LIDER, RolUsuarioEnum.VETERINARIO, RolUsuarioEnum.ADMIN)
    ),
) -> Animal:
    try:
        return registrar_salida(
            db,
            animal_id=animal_id,
            causal=datos.causal,
            fecha=datos.fecha,
            notas=datos.notas,
            responsable=usuario.username,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
