from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token_unidad_especial(db_session) -> str:
    usuario = Usuario(
        nombre="Unidad Especial",
        rol=RolUsuarioEnum.UNIDAD_ESPECIAL,
        username="unidad.especial",
        password_hash=hash_password("vbp2026"),
    )
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject="unidad.especial", rol=RolUsuarioEnum.UNIDAD_ESPECIAL.value)


def _crear_animal(db_session, estado=EstadoAnimalEnum.VBP_ACTIVO) -> int:
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
        estado=estado,
    )
    db_session.add(animal)
    db_session.commit()
    return animal.id


def test_unidad_especial_registra_visita(db_session):
    token = _token_unidad_especial(db_session)
    animal_id = _crear_animal(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/visitas",
        json={"estado_salud": "BUENO", "estado_comportamiento": "Tranquilo", "peso_kg": 14.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201
    assert respuesta.json()["estado_salud"] == "BUENO"


def test_visita_a_candidato_devuelve_409(db_session):
    token = _token_unidad_especial(db_session)
    animal_id = _crear_animal(db_session, estado=EstadoAnimalEnum.CANDIDATO)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/visitas",
        json={"estado_salud": "BUENO", "estado_comportamiento": "Tranquilo"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 409


def test_comunidad_no_puede_registrar_visita(db_session):
    usuario = Usuario(
        nombre="Maria", rol=RolUsuarioEnum.COMUNIDAD, username="maria.comunidad", password_hash=hash_password("vbp2026")
    )
    db_session.add(usuario)
    db_session.commit()
    token = create_access_token(subject="maria.comunidad", rol=RolUsuarioEnum.COMUNIDAD.value)
    animal_id = _crear_animal(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/visitas",
        json={"estado_salud": "BUENO", "estado_comportamiento": "Tranquilo"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 403


def test_solo_unidad_especial_y_admin_registran_visita(db_session):
    animal_id = _crear_animal(db_session)
    for rol in (RolUsuarioEnum.COMUNIDAD, RolUsuarioEnum.LIDER, RolUsuarioEnum.VETERINARIO):
        usuario = Usuario(
            nombre=f"Usuario {rol.value}",
            rol=rol,
            username=f"usuario.{rol.value.lower()}",
            password_hash=hash_password("vbp2026"),
        )
        db_session.add(usuario)
        db_session.commit()
        token = create_access_token(subject=f"usuario.{rol.value.lower()}", rol=rol.value)
        respuesta = client.post(
            f"/api/v1/animales/{animal_id}/visitas",
            json={"estado_salud": "BUENO", "estado_comportamiento": "Tranquilo"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert respuesta.status_code == 403

    usuario_admin = Usuario(
        nombre="Administrador", rol=RolUsuarioEnum.ADMIN, username="admin", password_hash=hash_password("vbp2026")
    )
    db_session.add(usuario_admin)
    db_session.commit()
    token_admin = create_access_token(subject="admin", rol=RolUsuarioEnum.ADMIN.value)
    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/visitas",
        json={"estado_salud": "BUENO", "estado_comportamiento": "Tranquilo"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert respuesta.status_code == 201
