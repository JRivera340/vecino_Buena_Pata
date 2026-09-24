import math

from sqlalchemy.orm import Query, Session

from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.enums import EstadoAnimalEnum
from app.models.visita_seguimiento import VisitaSeguimiento

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


def obtener_hoja_vida_publica(db: Session, animal_id: int) -> dict | None:
    animal = _animales_publicos(db).filter(Animal.id == animal_id).first()
    if animal is None:
        return None

    visita = (
        db.query(VisitaSeguimiento)
        .filter_by(animal_id=animal.id)
        .order_by(VisitaSeguimiento.fecha.desc(), VisitaSeguimiento.id.desc())
        .first()
    )
    ultima_visita = None
    if visita is not None:
        ultima_visita = {
            "fecha": visita.fecha,
            "estado_salud": visita.estado_salud,
            "peso_kg": visita.peso_kg,
        }

    return {
        "id": animal.id,
        "nombre": animal.nombre,
        "especie": animal.especie,
        "sexo": animal.sexo,
        "tamano": animal.tamano,
        "edad_estimada": animal.edad_estimada,
        "descripcion": animal.descripcion,
        "foto_principal": animal.foto_principal,
        "barrio": animal.barrio,
        "fecha_inscripcion": animal.fecha_inscripcion,
        "esterilizado": animal.esterilizado,
        "tiene_microchip": bool(animal.numero_microchip),
        "ultima_visita": ultima_visita,
    }
