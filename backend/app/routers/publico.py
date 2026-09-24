from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.reporte_novedad import ReporteNovedad
from app.schemas.publico import (
    AnimalMapaPublicoSchema,
    AnimalPublicoSchema,
    HojaVidaPublicaSchema,
    ReporteNovedadCrear,
    ReporteNovedadRespuesta,
)
from app.services.mapa_publico import listar_mapa_publico, obtener_hoja_vida_publica

router = APIRouter(prefix="/publico", tags=["publico"])


@router.get("/mapa", response_model=list[AnimalMapaPublicoSchema])
def obtener_mapa_publico(respuesta: Response, db: Session = Depends(get_db)) -> list[dict]:
    respuesta.headers["Cache-Control"] = "public, max-age=60"
    return listar_mapa_publico(db)


@router.get("/animales/{animal_id}/hoja-vida", response_model=HojaVidaPublicaSchema)
def obtener_hoja_vida(animal_id: int, db: Session = Depends(get_db)) -> dict:
    hoja = obtener_hoja_vida_publica(db, animal_id)
    if hoja is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal no disponible.")
    return hoja


def _buscar_animal_por_codigo(db: Session, codigo: str) -> Animal:
    collar = db.query(CollarQr).filter_by(codigo=codigo, activo=True).first()
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
