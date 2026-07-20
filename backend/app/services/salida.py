from datetime import datetime

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.enums import CausalSalidaEnum, EstadoAnimalEnum
from app.services.historial import registrar_evento

_ESTADO_POR_CAUSAL = {
    CausalSalidaEnum.ADOPCION: EstadoAnimalEnum.ADOPTADO,
    CausalSalidaEnum.PERDIDA: EstadoAnimalEnum.PERDIDO,
    CausalSalidaEnum.FALLECIMIENTO: EstadoAnimalEnum.FALLECIDO,
}


def registrar_salida(
    db: Session,
    animal_id: int,
    causal: CausalSalidaEnum,
    fecha: datetime,
    notas: str | None,
    responsable: str,
) -> Animal:
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise ValueError("Animal no encontrado.")
    if animal.estado != EstadoAnimalEnum.VBP_ACTIVO:
        raise ValueError(f"No se puede registrar salida de un animal en estado {animal.estado.value}.")

    animal.estado = _ESTADO_POR_CAUSAL[causal]
    animal.causal_salida = causal
    animal.fecha_salida = fecha
    animal.notas_salida = notas

    collar = db.query(CollarQr).filter_by(animal_id=animal_id).first()
    if collar is not None:
        collar.activo = False

    db.commit()
    db.refresh(animal)

    registrar_evento(
        db,
        animal_id=animal_id,
        tipo_evento="SALIDA",
        usuario=responsable,
        detalle={"causal": causal.value},
    )

    return animal
