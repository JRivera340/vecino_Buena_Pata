from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import SexoEnum, TamanoEnum, TipoComunidadEnum
from app.services.historial import registrar_evento


def _crear_animal(db_session) -> Animal:
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
        nombre="Rocky",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.MEDIANO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
    )
    db_session.add(animal)
    db_session.commit()
    return animal


def test_registrar_evento_guarda_detalle_json(db_session):
    animal = _crear_animal(db_session)

    evento = registrar_evento(
        db_session,
        animal_id=animal.id,
        tipo_evento="INSCRIPCION",
        usuario="maria.comunidad",
        detalle={"barrio": "El Poblado"},
    )

    assert evento.id is not None
    assert evento.tipo_evento == "INSCRIPCION"
    assert evento.usuario == "maria.comunidad"
    assert evento.detalle == {"barrio": "El Poblado"}
    assert evento.animal_id == animal.id


def test_registrar_evento_queda_en_orden_cronologico(db_session):
    animal = _crear_animal(db_session)
    registrar_evento(db_session, animal_id=animal.id, tipo_evento="INSCRIPCION", usuario="maria.comunidad", detalle={})
    registrar_evento(db_session, animal_id=animal.id, tipo_evento="VALIDACION", usuario="dr.rojas", detalle={})

    from app.models.evento_historial import EventoHistorial

    eventos = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).order_by(EventoHistorial.id).all()
    assert [e.tipo_evento for e in eventos] == ["INSCRIPCION", "VALIDACION"]
