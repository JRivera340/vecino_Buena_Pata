from datetime import datetime, timezone

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

    animal.visita_en_camino_por = None
    animal.visita_en_camino_desde = None
    db.commit()

    if estado_salud != EstadoSaludEnum.BUENO:
        from app.services.notificaciones_internas import crear_notificaciones
        crear_notificaciones(db, animal=animal, origen_tipo="VISITA_PREOCUPANTE", origen_id=visita.id)

    return visita


def marcar_en_camino(db: Session, animal_id: int, responsable: str) -> Animal:
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise ValueError("Animal no encontrado.")
    if animal.estado != EstadoAnimalEnum.VBP_ACTIVO:
        raise ValueError(f"No se puede marcar en camino un animal en estado {animal.estado.value}.")
    if animal.visita_en_camino_por is not None and animal.visita_en_camino_por != responsable:
        raise ValueError(f"{animal.visita_en_camino_por} ya va en camino a visitarlo.")
    animal.visita_en_camino_por = responsable
    animal.visita_en_camino_desde = datetime.now(timezone.utc)
    db.commit()
    db.refresh(animal)
    return animal


def cancelar_en_camino(db: Session, animal_id: int, responsable: str) -> Animal:
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise ValueError("Animal no encontrado.")
    if animal.visita_en_camino_por != responsable:
        raise ValueError("No marcaste tu ir en camino a este animal.")
    animal.visita_en_camino_por = None
    animal.visita_en_camino_desde = None
    db.commit()
    db.refresh(animal)
    return animal
