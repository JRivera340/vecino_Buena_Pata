from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import requiere_rol
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.models.visita_seguimiento import VisitaSeguimiento
from app.schemas.animal import AnimalSchema
from app.schemas.visita import VisitaCrear, VisitaSchema
from app.services.seguimiento import cancelar_en_camino, marcar_en_camino, registrar_visita

router = APIRouter(prefix="/animales/{animal_id}/visitas", tags=["visitas"])


@router.post("", response_model=VisitaSchema, status_code=201)
def crear_visita(
    animal_id: int,
    datos: VisitaCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.UNIDAD_ESPECIAL, RolUsuarioEnum.ADMIN)),
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


@router.post("/en-camino", response_model=AnimalSchema, status_code=200)
def ir_en_camino(
    animal_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.UNIDAD_ESPECIAL, RolUsuarioEnum.ADMIN)),
):
    try:
        return marcar_en_camino(db, animal_id=animal_id, responsable=usuario.username)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.delete("/en-camino", status_code=204)
def cancelar_ir_en_camino(
    animal_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.UNIDAD_ESPECIAL, RolUsuarioEnum.ADMIN)),
) -> None:
    try:
        cancelar_en_camino(
            db,
            animal_id=animal_id,
            responsable=usuario.username,
            es_admin=usuario.rol == RolUsuarioEnum.ADMIN,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
