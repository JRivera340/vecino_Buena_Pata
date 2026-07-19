from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoSaludEnum, SexoEnum, TamanoEnum, TipoComunidadEnum, VeredictoValidacionEnum
from app.models.validacion import Validacion
from app.models.visita_seguimiento import VisitaSeguimiento


def _crear_animal(db_session):
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
        nombre="Canela",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.PEQUENO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
    )
    db_session.add(animal)
    db_session.commit()
    return animal


def test_crear_validacion_con_pendientes(db_session):
    animal = _crear_animal(db_session)
    validacion = Validacion(
        animal_id=animal.id,
        veterinario="dr.rojas",
        veredicto=VeredictoValidacionEnum.CON_PENDIENTES,
        pendientes=["SIN_CHIP", "SIN_ESTERILIZAR"],
        observaciones="Falta chip y esterilizacion",
    )
    db_session.add(validacion)
    db_session.commit()

    guardada = db_session.query(Validacion).filter_by(animal_id=animal.id).one()
    assert guardada.veredicto == VeredictoValidacionEnum.CON_PENDIENTES
    assert guardada.pendientes == ["SIN_CHIP", "SIN_ESTERILIZAR"]


def test_crear_visita_seguimiento(db_session):
    animal = _crear_animal(db_session)
    visita = VisitaSeguimiento(
        animal_id=animal.id,
        responsable="dr.rojas",
        estado_salud=EstadoSaludEnum.BUENO,
        estado_comportamiento="Tranquilo con la comunidad",
        peso_kg=12.5,
    )
    db_session.add(visita)
    db_session.commit()

    guardada = db_session.query(VisitaSeguimiento).filter_by(animal_id=animal.id).one()
    assert guardada.estado_salud == EstadoSaludEnum.BUENO
    assert guardada.peso_kg == 12.5
