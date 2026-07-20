from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.evento_historial import EventoHistorial
from app.services.inscripcion import inscribir_animal


def _crear_comunidad(db_session) -> int:
    comunidad = Comunidad(
        nombre="Patitas del Sur",
        tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="El Poblado",
        telefono_contacto="3009876543",
        email_contacto="contacto@patitasdelsur.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    return comunidad.id


def test_inscribir_animal_queda_candidato_y_registra_historial(db_session):
    comunidad_id = _crear_comunidad(db_session)

    animal = inscribir_animal(
        db_session,
        datos={
            "nombre": "Estrella",
            "sexo": SexoEnum.HEMBRA,
            "tamano": TamanoEnum.PEQUENO,
            "edad_estimada": None,
            "descripcion": None,
            "foto_principal": None,
            "barrio": "El Poblado",
            "latitud": 4.65,
            "longitud": -74.1,
            "comunidad_id": comunidad_id,
        },
        inscrito_por="maria.comunidad",
    )

    assert animal.id is not None
    assert animal.estado == EstadoAnimalEnum.CANDIDATO
    assert animal.inscrito_por == "maria.comunidad"

    eventos = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).all()
    assert len(eventos) == 1
    assert eventos[0].tipo_evento == "INSCRIPCION"
    assert eventos[0].usuario == "maria.comunidad"
