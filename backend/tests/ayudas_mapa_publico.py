import itertools
from datetime import datetime

from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, EstadoSaludEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.visita_seguimiento import VisitaSeguimiento

_contador_codigos = itertools.count(1)


def _comunidad(db_session) -> Comunidad:
    comunidad = db_session.query(Comunidad).first()
    if comunidad is None:
        comunidad = Comunidad(
            nombre="Patitas del Sur",
            tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
            barrio="La Esperanza",
            telefono_contacto="3009876543",
            email_contacto="contacto@patitasdelsur.org",
        )
        db_session.add(comunidad)
        db_session.commit()
    return comunidad


def crear_animal(
    db_session,
    *,
    estado: EstadoAnimalEnum = EstadoAnimalEnum.VBP_ACTIVO,
    con_collar: bool = True,
    collar_activo: bool = True,
    **kwargs,
) -> Animal:
    valores = dict(
        nombre="Rocky",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.MEDIANO,
        barrio="La Esperanza",
        latitud=4.6097,
        longitud=-74.0817,
        comunidad_id=_comunidad(db_session).id,
        inscrito_por="maria.comunidad",
        estado=estado,
    )
    valores.update(kwargs)
    animal = Animal(**valores)
    db_session.add(animal)
    db_session.commit()
    if con_collar:
        db_session.add(
            CollarQr(animal_id=animal.id, codigo=f"vbp-prueba{next(_contador_codigos)}", activo=collar_activo)
        )
        db_session.commit()
    return animal


def crear_visita(
    db_session,
    animal_id: int,
    fecha: datetime,
    estado_salud: EstadoSaludEnum = EstadoSaludEnum.BUENO,
    peso_kg: float | None = None,
) -> VisitaSeguimiento:
    visita = VisitaSeguimiento(
        animal_id=animal_id,
        fecha=fecha,
        responsable="dr.rojas",
        estado_salud=estado_salud,
        estado_comportamiento="Tranquilo",
        peso_kg=peso_kg,
        observaciones="Nota interna de la visita",
    )
    db_session.add(visita)
    db_session.commit()
    return visita
