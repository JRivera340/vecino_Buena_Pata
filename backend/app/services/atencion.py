from sqlalchemy.orm import Session

from app.models.atencion_especial import AtencionEspecial
from app.models.enums import EstadoReporteEnum
from app.models.reporte_novedad import ReporteNovedad
from app.services.historial import registrar_evento


def registrar_atencion(
    db: Session,
    reporte_id: int,
    responsable: str,
    acciones_realizadas: str,
    resultado: str,
) -> AtencionEspecial:
    reporte = db.get(ReporteNovedad, reporte_id)
    if reporte is None:
        raise ValueError("Reporte no encontrado.")
    if reporte.estado == EstadoReporteEnum.CERRADO:
        raise ValueError("Este reporte ya esta cerrado.")

    atencion = AtencionEspecial(
        reporte_id=reporte_id,
        responsable=responsable,
        acciones_realizadas=acciones_realizadas,
        resultado=resultado,
    )
    db.add(atencion)
    reporte.estado = EstadoReporteEnum.CERRADO
    db.commit()
    db.refresh(atencion)

    registrar_evento(
        db,
        animal_id=reporte.animal_id,
        tipo_evento="ATENCION_ESPECIAL",
        usuario=responsable,
        detalle={"reporte_id": reporte_id, "resultado": resultado},
    )

    return atencion
