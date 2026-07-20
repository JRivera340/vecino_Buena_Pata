import pytest

from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, EstadoSaludEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.evento_historial import EventoHistorial
from app.services.seguimiento import registrar_visita


def _crear_animal(db_session, estado=EstadoAnimalEnum.VBP_ACTIVO) -> Animal:
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
        nombre="Duque",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.MEDIANO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=estado,
        esterilizado=True,
        numero_microchip="985141900004",
    )
    db_session.add(animal)
    db_session.commit()
    return animal


def test_registrar_visita_en_animal_vbp_activo(db_session):
    animal = _crear_animal(db_session)

    visita = registrar_visita(
        db_session,
        animal_id=animal.id,
        responsable="dr.rojas",
        estado_salud=EstadoSaludEnum.BUENO,
        estado_comportamiento="Tranquilo con la comunidad",
        peso_kg=14.0,
    )

    assert visita.id is not None
    assert visita.animal_id == animal.id

    eventos = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).all()
    assert any(e.tipo_evento == "VISITA_SEGUIMIENTO" for e in eventos)


def test_no_se_puede_registrar_visita_a_un_candidato(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.CANDIDATO)

    with pytest.raises(ValueError):
        registrar_visita(
            db_session,
            animal_id=animal.id,
            responsable="dr.rojas",
            estado_salud=EstadoSaludEnum.BUENO,
            estado_comportamiento="Tranquilo",
        )


def test_no_se_puede_registrar_visita_a_un_fallecido(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.FALLECIDO)

    with pytest.raises(ValueError):
        registrar_visita(
            db_session,
            animal_id=animal.id,
            responsable="dr.rojas",
            estado_salud=EstadoSaludEnum.BUENO,
            estado_comportamiento="Tranquilo",
        )
