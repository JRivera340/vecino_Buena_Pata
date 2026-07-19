from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.comunidad import Comunidad
from app.schemas.comunidad import ComunidadCrear, ComunidadSchema

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
