from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import requiere_rol
from app.models.enums import RolUsuarioEnum
from app.schemas.usuario import UsuarioCrear, UsuarioEditar, UsuarioSchema
from app.services import usuarios as servicio

router = APIRouter(prefix="/usuarios", tags=["usuarios"], dependencies=[Depends(requiere_rol(RolUsuarioEnum.ADMIN))])


@router.get("", response_model=list[UsuarioSchema])
def listar_usuarios(db: Session = Depends(get_db)) -> list[UsuarioSchema]:
    return servicio.listar_usuarios(db)


@router.post("", response_model=UsuarioSchema, status_code=201)
def crear_usuario(datos: UsuarioCrear, db: Session = Depends(get_db)) -> UsuarioSchema:
    try:
        return servicio.crear_usuario(db, datos)
    except servicio.UsuarioInvalido as error:
        raise HTTPException(status_code=error.estado, detail=str(error)) from error
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe un usuario con esos datos.") from error


@router.patch("/{usuario_id}", response_model=UsuarioSchema)
def editar_usuario(usuario_id: int, datos: UsuarioEditar, db: Session = Depends(get_db)) -> UsuarioSchema:
    try:
        return servicio.editar_usuario(db, usuario_id, datos)
    except servicio.UsuarioInvalido as error:
        raise HTTPException(status_code=error.estado, detail=str(error)) from error
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe un usuario con esos datos.") from error
