import pytest

from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoComunidadEnum, VeredictoValidacionEnum
from app.models.evento_historial import EventoHistorial
from app.services.validacion import registrar_validacion


def _crear_animal(db_session, estado=EstadoAnimalEnum.CANDIDATO) -> Animal:
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
        nombre="Tribilin",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.GRANDE,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=estado,
    )
    db_session.add(animal)
    db_session.commit()
    return animal


def test_validacion_con_pendientes_pasa_a_en_proceso(db_session):
    animal = _crear_animal(db_session)

    validacion = registrar_validacion(
        db_session,
        animal_id=animal.id,
        veterinario="dr.rojas",
        veredicto=VeredictoValidacionEnum.CON_PENDIENTES,
        pendientes=["SIN_ESTERILIZAR"],
        observaciones="Falta esterilizar.",
    )

    db_session.refresh(animal)
    assert validacion.veredicto == VeredictoValidacionEnum.CON_PENDIENTES
    assert animal.estado == EstadoAnimalEnum.EN_PROCESO

    eventos = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).all()
    assert any(e.tipo_evento == "VALIDACION" for e in eventos)


def test_validacion_aprobada_no_cambia_estado_pero_actualiza_esterilizado_y_chip(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.EN_PROCESO)

    registrar_validacion(
        db_session,
        animal_id=animal.id,
        veterinario="dr.rojas",
        veredicto=VeredictoValidacionEnum.APROBADO,
        pendientes=[],
        observaciones="Cumple todo.",
        esterilizado=True,
        numero_microchip="985141900002",
    )

    db_session.refresh(animal)
    assert animal.estado == EstadoAnimalEnum.EN_PROCESO
    assert animal.esterilizado is True
    assert animal.numero_microchip == "985141900002"


def test_no_se_puede_validar_un_animal_vbp_activo(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.VBP_ACTIVO)

    with pytest.raises(ValueError):
        registrar_validacion(
            db_session,
            animal_id=animal.id,
            veterinario="dr.rojas",
            veredicto=VeredictoValidacionEnum.APROBADO,
            pendientes=[],
            observaciones="",
        )
