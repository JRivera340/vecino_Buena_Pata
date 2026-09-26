from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, requiere_rol
from app.models.atencion_especial import AtencionEspecial
from app.models.enums import RolUsuarioEnum
from app.models.reporte_novedad import ReporteNovedad
from app.models.usuario import Usuario
from app.schemas.reporte import AtencionCrear, AtencionSchema, ReporteSchema
from app.services.atencion import registrar_atencion

router = APIRouter(prefix="/reportes", tags=["reportes"])


@router.get("", response_model=list[ReporteSchema])
def listar_reportes(db: Session = Depends(get_db), _=Depends(get_current_user)) -> list[ReporteNovedad]:
    return db.query(ReporteNovedad).order_by(ReporteNovedad.fecha.desc()).all()


@router.post("/{reporte_id}/atencion", response_model=AtencionSchema, status_code=201)
def crear_atencion(
    reporte_id: int,
    datos: AtencionCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.VETERINARIO, RolUsuarioEnum.ADMIN)),
) -> AtencionEspecial:
    try:
        return registrar_atencion(
            db,
            reporte_id=reporte_id,
            responsable=usuario.username,
            acciones_realizadas=datos.acciones_realizadas,
            resultado=datos.resultado,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
