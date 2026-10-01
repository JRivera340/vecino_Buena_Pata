from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, requiere_rol
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.schemas.comunidad import ComunidadCrear, ComunidadSchema
from app.schemas.usuario import MiembroComunidadCrear, UsuarioSchema
from app.services import usuarios as servicio_usuarios

router = APIRouter(prefix="/comunidades", tags=["comunidades"])


@router.get("", response_model=list[ComunidadSchema])
def listar_comunidades(db: Session = Depends(get_db), _=Depends(get_current_user)) -> list[Comunidad]:
    return db.query(Comunidad).order_by(Comunidad.nombre).all()


@router.post("", response_model=ComunidadSchema, status_code=201)
def crear_comunidad(
    datos: ComunidadCrear, db: Session = Depends(get_db), _=Depends(get_current_user)
) -> Comunidad:
    comunidad = Comunidad(**datos.model_dump())
    db.add(comunidad)
    db.commit()
    db.refresh(comunidad)
    return comunidad


@router.post("/mis-miembros", response_model=UsuarioSchema, status_code=201)
def agregar_miembro(
    datos: MiembroComunidadCrear,
    db: Session = Depends(get_db),
    lider: Usuario = Depends(requiere_rol(RolUsuarioEnum.LIDER, RolUsuarioEnum.ADMIN)),
) -> UsuarioSchema:
    try:
        return servicio_usuarios.agregar_miembro(db, lider, datos)
    except servicio_usuarios.UsuarioInvalido as error:
        raise HTTPException(status_code=error.estado, detail=str(error)) from error
