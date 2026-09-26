from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.enums import EspecieEnum, EstadoAnimalEnum
from app.schemas.indicadores import IndicadoresLocalidades
from app.services.indicadores_localidades import calcular_indicadores

router = APIRouter(prefix="/indicadores", tags=["indicadores"])


@router.get("/localidades", response_model=IndicadoresLocalidades)
def indicadores_por_localidad(
    desde: date | None = None,
    hasta: date | None = None,
    estado: list[EstadoAnimalEnum] | None = Query(default=None),
    especie: EspecieEnum | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> IndicadoresLocalidades:
    if desde and hasta and desde > hasta:
        raise HTTPException(status_code=422, detail="La fecha inicial no puede ser posterior a la final.")
    return calcular_indicadores(db, desde, hasta, estado, especie)
