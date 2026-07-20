from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.enums import EstadoAnimalEnum, VeredictoValidacionEnum
from app.models.validacion import Validacion
from app.services.historial import registrar_evento

_ESTADOS_VALIDABLES = (EstadoAnimalEnum.CANDIDATO, EstadoAnimalEnum.EN_PROCESO)


def registrar_validacion(
    db: Session,
    animal_id: int,
    veterinario: str,
    veredicto: VeredictoValidacionEnum,
    pendientes: list[str],
    observaciones: str | None,
    esterilizado: bool | None = None,
    numero_microchip: str | None = None,
) -> Validacion:
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise ValueError("Animal no encontrado.")
    if animal.estado not in _ESTADOS_VALIDABLES:
        raise ValueError(f"No se puede validar un animal en estado {animal.estado.value}.")

    validacion = Validacion(
        animal_id=animal_id,
        veterinario=veterinario,
        veredicto=veredicto,
        pendientes=pendientes,
        observaciones=observaciones,
    )
    db.add(validacion)

    if esterilizado is not None:
        animal.esterilizado = esterilizado
    if numero_microchip is not None:
        animal.numero_microchip = numero_microchip

    if veredicto == VeredictoValidacionEnum.CON_PENDIENTES:
        animal.estado = EstadoAnimalEnum.EN_PROCESO

    db.commit()
    db.refresh(validacion)

    registrar_evento(
        db,
        animal_id=animal_id,
        tipo_evento="VALIDACION",
        usuario=veterinario,
        detalle={"veredicto": veredicto.value, "pendientes": pendientes},
    )

    return validacion
