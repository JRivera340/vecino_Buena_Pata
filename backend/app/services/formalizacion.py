import secrets

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.enums import EstadoAnimalEnum
from app.models.validacion import Validacion
from app.services.animal_estado import criterios_cumplidos
from app.services.historial import registrar_evento

_ESTADOS_FORMALIZABLES = (EstadoAnimalEnum.CANDIDATO, EstadoAnimalEnum.EN_PROCESO)


def generar_codigo_qr(db: Session) -> str:
    while True:
        candidato = f"vbp-{secrets.token_hex(3)}"
        existe = db.query(CollarQr).filter_by(codigo=candidato).first()
        if existe is None:
            return candidato


def formalizar_vbp(db: Session, animal_id: int, lider: str) -> tuple[Animal, CollarQr]:
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise ValueError("Animal no encontrado.")
    if animal.estado not in _ESTADOS_FORMALIZABLES:
        raise ValueError(f"No se puede formalizar un animal en estado {animal.estado.value}.")

    ultima_validacion = (
        db.query(Validacion).filter_by(animal_id=animal_id).order_by(Validacion.fecha.desc()).first()
    )
    if ultima_validacion is None:
        raise ValueError("El animal no tiene ninguna validacion registrada.")

    cumple, faltantes = criterios_cumplidos(
        esterilizado=animal.esterilizado,
        numero_microchip=animal.numero_microchip,
        veredicto=ultima_validacion.veredicto,
        pendientes=ultima_validacion.pendientes,
    )
    if not cumple:
        raise ValueError("No cumple los criterios de formalizacion: " + " ".join(faltantes))

    animal.estado = EstadoAnimalEnum.VBP_ACTIVO

    collar = CollarQr(animal_id=animal_id, codigo=generar_codigo_qr(db), activo=True)
    db.add(collar)
    db.commit()
    db.refresh(animal)
    db.refresh(collar)

    registrar_evento(
        db,
        animal_id=animal_id,
        tipo_evento="FORMALIZACION",
        usuario=lider,
        detalle={"codigo_collar": collar.codigo},
    )

    return animal, collar
