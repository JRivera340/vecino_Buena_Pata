import math

from sqlalchemy.orm import Query, Session

from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.enums import EstadoAnimalEnum

TAMANO_CELDA = 0.003


def aproximar_coordenada(valor: float) -> float:
    celda = math.floor(valor / TAMANO_CELDA)
    return round(celda * TAMANO_CELDA + TAMANO_CELDA / 2, 6)


def _animales_publicos(db: Session) -> Query:
    return (
        db.query(Animal)
        .join(CollarQr, CollarQr.animal_id == Animal.id)
        .filter(Animal.estado == EstadoAnimalEnum.VBP_ACTIVO, CollarQr.activo.is_(True))
    )


def listar_mapa_publico(db: Session) -> list[dict]:
    animales = _animales_publicos(db).order_by(Animal.id).all()
    return [
        {
            "id": animal.id,
            "nombre": animal.nombre,
            "especie": animal.especie,
            "foto_principal": animal.foto_principal,
            "barrio": animal.barrio,
            "latitud": aproximar_coordenada(animal.latitud),
            "longitud": aproximar_coordenada(animal.longitud),
        }
        for animal in animales
    ]
