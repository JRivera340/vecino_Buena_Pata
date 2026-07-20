from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token_veterinario(db_session) -> str:
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


def test_veterinario_registra_validacion_con_pendientes(db_session):
    token = _token_veterinario(db_session)
    animal_id = _crear_animal(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/validaciones",
        json={"veredicto": "CON_PENDIENTES", "pendientes": ["SIN_ESTERILIZAR"], "observaciones": "Falta esterilizar."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201
    assert respuesta.json()["veredicto"] == "CON_PENDIENTES"


def test_validacion_en_estado_ilegal_devuelve_409(db_session):
    token = _token_veterinario(db_session)
    animal_id = _crear_animal(db_session)

    animal = db_session.get(Animal, animal_id)
    animal.estado = EstadoAnimalEnum.VBP_ACTIVO
    db_session.commit()

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/validaciones",
        json={"veredicto": "APROBADO", "pendientes": [], "observaciones": ""},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 409


def test_comunidad_no_puede_validar(db_session):
    usuario = Usuario(
        nombre="Maria", rol=RolUsuarioEnum.COMUNIDAD, username="maria.comunidad", password_hash=hash_password("vbp2026")
    )
    db_session.add(usuario)
    db_session.commit()
    token = create_access_token(subject="maria.comunidad", rol=RolUsuarioEnum.COMUNIDAD.value)
    animal_id = _crear_animal(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/validaciones",
        json={"veredicto": "APROBADO", "pendientes": [], "observaciones": ""},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 403
