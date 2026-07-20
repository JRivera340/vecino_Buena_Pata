from datetime import datetime, timezone

import pytest

from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import CausalSalidaEnum, EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.evento_historial import EventoHistorial
from app.services.salida import registrar_salida


def _crear_animal_con_collar(db_session, estado=EstadoAnimalEnum.VBP_ACTIVO) -> Animal:
    comunidad = Comunidad(
        nombre="Patitas del Sur",
        tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="El Poblado",
        telefono_contacto="3009876543",
        email_contacto="contacto@patitasdelsur.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    animal = Animal(
        nombre="Cafe",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.MEDIANO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=estado,
    )
    db_session.add(animal)
    db_session.commit()
    if estado == EstadoAnimalEnum.VBP_ACTIVO:
        db_session.add(CollarQr(animal_id=animal.id, codigo="vbp-abc123", activo=True))
        db_session.commit()
    return animal


def test_registrar_salida_por_fallecimiento_desactiva_collar(db_session):
    animal = _crear_animal_con_collar(db_session)

    animal_salido = registrar_salida(
        db_session,
        animal_id=animal.id,
        causal=CausalSalidaEnum.FALLECIMIENTO,
        fecha=datetime.now(timezone.utc),
        notas="Accidente en la via principal.",
        responsable="dr.rojas",
    )

    assert animal_salido.estado == EstadoAnimalEnum.FALLECIDO
    assert animal_salido.causal_salida == CausalSalidaEnum.FALLECIMIENTO

    collar = db_session.query(CollarQr).filter_by(animal_id=animal.id).one()
    assert collar.activo is False

    eventos = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).all()
    assert any(e.tipo_evento == "SALIDA" for e in eventos)


def test_registrar_salida_por_adopcion(db_session):
    animal = _crear_animal_con_collar(db_session)

    animal_salido = registrar_salida(
        db_session,
        animal_id=animal.id,
        causal=CausalSalidaEnum.ADOPCION,
        fecha=datetime.now(timezone.utc),
        notas="Adoptado por familia del barrio.",
        responsable="dr.rojas",
    )

    assert animal_salido.estado == EstadoAnimalEnum.ADOPTADO


def test_no_se_puede_registrar_salida_de_un_candidato(db_session):
    animal = _crear_animal_con_collar(db_session, estado=EstadoAnimalEnum.CANDIDATO)

    with pytest.raises(ValueError):
        registrar_salida(
            db_session,
            animal_id=animal.id,
            causal=CausalSalidaEnum.ADOPCION,
            fecha=datetime.now(timezone.utc),
            notas="",
            responsable="dr.rojas",
        )
