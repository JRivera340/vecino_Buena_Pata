from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.enums import EstadoAnimalEnum, EstadoSaludEnum
from app.services.historial import registrar_evento
from app.services.seguimiento import registrar_visita


def reactivar_perdido(
    db: Session,
    animal_id: int,
    veterinario: str,
    estado_salud: EstadoSaludEnum,
    estado_comportamiento: str,
) -> Animal:
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise ValueError("Animal no encontrado.")
    if animal.estado != EstadoAnimalEnum.PERDIDO:
        raise ValueError(f"No se puede reactivar un animal en estado {animal.estado.value}.")

    animal.estado = EstadoAnimalEnum.VBP_ACTIVO
    animal.causal_salida = None
    animal.fecha_salida = None
    animal.notas_salida = None

    collar = db.query(CollarQr).filter_by(animal_id=animal_id).first()
    if collar is not None:
        collar.activo = True

    db.commit()
    db.refresh(animal)

    registrar_visita(
        db,
        animal_id=animal_id,
        responsable=veterinario,
        estado_salud=estado_salud,
        estado_comportamiento=estado_comportamiento,
        observaciones="Visita de verificacion tras reaparecer.",
    )

    registrar_evento(
        db,
        animal_id=animal_id,
        tipo_evento="REACTIVACION",
        usuario=veterinario,
        detalle={},
    )

    return animal
