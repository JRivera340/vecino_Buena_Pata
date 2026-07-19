from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.main import app
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario

client = TestClient(app)


def test_login_correcto_devuelve_token(db_session):
    usuario = Usuario(
        nombre="Dr. Rojas",
        rol=RolUsuarioEnum.VETERINARIO,
        username="dr.rojas",
        password_hash=hash_password("vbp2026"),
    )
    db_session.add(usuario)
    db_session.commit()

    respuesta = client.post(
        "/api/v1/auth/login",
        data={"username": "dr.rojas", "password": "vbp2026"},
    )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["rol"] == "VETERINARIO"
    assert cuerpo["nombre"] == "Dr. Rojas"
    assert "access_token" in cuerpo


def test_login_con_password_incorrecta_devuelve_401(db_session):
    usuario = Usuario(
        nombre="Dr. Rojas",
        rol=RolUsuarioEnum.VETERINARIO,
        username="dr.rojas",
        password_hash=hash_password("vbp2026"),
    )
    db_session.add(usuario)
    db_session.commit()

    respuesta = client.post(
        "/api/v1/auth/login",
        data={"username": "dr.rojas", "password": "incorrecta"},
    )
    assert respuesta.status_code == 401


def test_endpoint_protegido_sin_token_devuelve_401(db_session):
    respuesta = client.get("/api/v1/comunidades")
    assert respuesta.status_code == 401
