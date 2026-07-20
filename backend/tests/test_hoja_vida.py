from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoSaludEnum, RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum, VeredictoValidacionEnum
from app.models.usuario import Usuario
from app.models.validacion import Validacion
from app.models.visita_seguimiento import VisitaSeguimiento
from app.services.historial import registrar_evento

client = TestClient(app)


def _token(db_session) -> str:
    usuario = Usuario(
        nombre="Dr. Rojas", rol=RolUsuarioEnum.VETERINARIO, username="dr.rojas", password_hash=hash_password("vbp2026")
    )
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject="dr.rojas", rol=RolUsuarioEnum.VETERINARIO.value)


def _crear_animal(db_session) -> int:
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
    return animal.id


def test_listar_historial_de_un_animal(db_session):
    token = _token(db_session)
    animal_id = _crear_animal(db_session)
    registrar_evento(db_session, animal_id=animal_id, tipo_evento="INSCRIPCION", usuario="maria.comunidad", detalle={"barrio": "El Poblado"})

    respuesta = client.get(f"/api/v1/animales/{animal_id}/historial", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert len(cuerpo) == 1
    assert cuerpo[0]["tipo_evento"] == "INSCRIPCION"
    assert cuerpo[0]["detalle"] == {"barrio": "El Poblado"}


def test_listar_visitas_de_un_animal(db_session):
    token = _token(db_session)
    animal_id = _crear_animal(db_session)
    db_session.add(
        VisitaSeguimiento(
            animal_id=animal_id,
            responsable="dr.rojas",
            estado_salud=EstadoSaludEnum.BUENO,
            estado_comportamiento="Tranquilo",
        )
    )
    db_session.commit()

    respuesta = client.get(f"/api/v1/animales/{animal_id}/visitas", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert len(cuerpo) == 1
    assert cuerpo[0]["estado_salud"] == "BUENO"


def test_listar_validaciones_de_un_animal(db_session):
    token = _token(db_session)
    animal_id = _crear_animal(db_session)
    db_session.add(
        Validacion(
            animal_id=animal_id,
            veterinario="dr.rojas",
            veredicto=VeredictoValidacionEnum.APROBADO,
            pendientes=[],
            observaciones="Cumple todo.",
        )
    )
    db_session.commit()

    respuesta = client.get(f"/api/v1/animales/{animal_id}/validaciones", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert len(cuerpo) == 1
    assert cuerpo[0]["veredicto"] == "APROBADO"


def test_hoja_de_vida_requiere_autenticacion(db_session):
    animal_id = _crear_animal(db_session)
    respuesta = client.get(f"/api/v1/animales/{animal_id}/historial")
    assert respuesta.status_code == 401
