from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.evento_historial import EventoHistorial


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
        nombre="Firulais",
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


def test_crear_collar_qr_unico_por_animal(db_session):
    animal = _crear_animal(db_session)
    collar = CollarQr(animal_id=animal.id, codigo="vbp-7f3k2")
    db_session.add(collar)
    db_session.commit()

    guardado = db_session.query(CollarQr).filter_by(animal_id=animal.id).one()
    assert guardado.codigo == "vbp-7f3k2"
    assert guardado.activo is True


def test_crear_evento_historial_con_detalle_json(db_session):
    animal = _crear_animal(db_session)
    evento = EventoHistorial(
        animal_id=animal.id,
        tipo_evento="INSCRIPCION",
        usuario="maria.comunidad",
        detalle={"barrio": "El Poblado", "comunidad": "Patitas del Sur"},
    )
    db_session.add(evento)
    db_session.commit()

    guardado = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).one()
    assert guardado.detalle["barrio"] == "El Poblado"
