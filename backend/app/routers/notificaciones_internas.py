from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.notificacion_interna import NotificacionInterna
from app.models.usuario import Usuario
from app.schemas.notificacion_interna import NotificacionInternaSchema

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


@router.get("", response_model=list[NotificacionInternaSchema])
def listar_notificaciones(
    db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> list[NotificacionInterna]:
    return (
        db.query(NotificacionInterna)
        .filter(NotificacionInterna.usuario_id == usuario.id)
        .order_by(NotificacionInterna.creada_en.desc())
        .all()
    )


@router.post("/{notificacion_id}/leer", response_model=NotificacionInternaSchema)
def marcar_leida(
    notificacion_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> NotificacionInterna:
    notificacion = db.get(NotificacionInterna, notificacion_id)
    if notificacion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificacion no encontrada.")
    if notificacion.usuario_id != usuario.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado.")
    notificacion.leida_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notificacion)
    return notificacion
