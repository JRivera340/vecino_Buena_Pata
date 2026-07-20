from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.reporte_novedad import ReporteNovedad
from app.schemas.publico import AnimalPublicoSchema, ReporteNovedadCrear, ReporteNovedadRespuesta

router = APIRouter(prefix="/publico", tags=["publico"])


def _buscar_animal_por_codigo(db: Session, codigo: str) -> Animal:
    collar = db.query(CollarQr).filter_by(codigo=codigo).first()
    if collar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Codigo no encontrado.")
    animal = db.get(Animal, collar.animal_id)
    if animal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal no encontrado.")
    return animal


@router.get("/animales/{codigo}", response_model=AnimalPublicoSchema)
def obtener_animal_publico(codigo: str, db: Session = Depends(get_db)) -> Animal:
    return _buscar_animal_por_codigo(db, codigo)


@router.post("/animales/{codigo}/reportes", response_model=ReporteNovedadRespuesta, status_code=201)
def crear_reporte_publico(
    codigo: str, datos: ReporteNovedadCrear, db: Session = Depends(get_db)
) -> ReporteNovedad:
    animal = _buscar_animal_por_codigo(db, codigo)
    reporte = ReporteNovedad(
        animal_id=animal.id,
        reportante_nombre=datos.reportante_nombre,
        descripcion=datos.descripcion,
        foto=datos.foto,
        latitud=datos.latitud,
        longitud=datos.longitud,
    )
    db.add(reporte)
    db.commit()
    db.refresh(reporte)
    return reporte
