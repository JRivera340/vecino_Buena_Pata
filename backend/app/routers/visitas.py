from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import requiere_rol
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.models.visita_seguimiento import VisitaSeguimiento
from app.schemas.visita import VisitaCrear, VisitaSchema
from app.services.seguimiento import registrar_visita

router = APIRouter(prefix="/animales/{animal_id}/visitas", tags=["visitas"])


@router.post("", response_model=VisitaSchema, status_code=201)
def crear_visita(
    animal_id: int,
    datos: VisitaCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.VETERINARIO, RolUsuarioEnum.ADMIN)),
) -> VisitaSeguimiento:
    try:
        return registrar_visita(
            db,
            animal_id=animal_id,
            responsable=usuario.username,
            estado_salud=datos.estado_salud,
            estado_comportamiento=datos.estado_comportamiento,
            peso_kg=datos.peso_kg,
            foto=datos.foto,
            observaciones=datos.observaciones,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
