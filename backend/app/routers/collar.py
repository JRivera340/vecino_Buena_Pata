from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.collar_qr import CollarQr
from app.services.qr import generar_imagen_qr

router = APIRouter(prefix="/animales/{animal_id}/collar", tags=["collar"])


@router.get("/qr.png")
def obtener_qr(animal_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)) -> Response:
    collar = db.query(CollarQr).filter_by(animal_id=animal_id).first()
    if collar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Este animal no tiene collar QR.")
    imagen = generar_imagen_qr(collar.codigo)
    return Response(content=imagen, media_type="image/png")
