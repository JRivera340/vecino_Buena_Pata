from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.enums import EstadoAnimalEnum, EstadoSaludEnum
from app.models.visita_seguimiento import VisitaSeguimiento
from app.services.historial import registrar_evento


def registrar_visita(
    db: Session,
    animal_id: int,
    responsable: str,
    estado_salud: EstadoSaludEnum,
    estado_comportamiento: str,
    peso_kg: float | None = None,
    foto: str | None = None,
    observaciones: str | None = None,
) -> VisitaSeguimiento:
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise ValueError("Animal no encontrado.")
    if animal.estado != EstadoAnimalEnum.VBP_ACTIVO:
        raise ValueError(f"No se puede registrar una visita a un animal en estado {animal.estado.value}.")

    visita = VisitaSeguimiento(
        animal_id=animal_id,
        responsable=responsable,
        estado_salud=estado_salud,
        estado_comportamiento=estado_comportamiento,
        peso_kg=peso_kg,
        foto=foto,
        observaciones=observaciones,
    )
    db.add(visita)
    db.commit()
    db.refresh(visita)

    registrar_evento(
        db,
        animal_id=animal_id,
        tipo_evento="VISITA_SEGUIMIENTO",
        usuario=responsable,
        detalle={"estado_salud": estado_salud.value},
    )

    return visita
