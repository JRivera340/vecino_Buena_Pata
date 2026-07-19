from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoComunidadEnum


def test_crear_animal_candidato(db_session):
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

    guardado = db_session.query(Animal).filter_by(nombre="Rocky").one()
    assert guardado.estado == EstadoAnimalEnum.CANDIDATO
    assert guardado.esterilizado is False
    assert guardado.comunidad_id == comunidad.id
