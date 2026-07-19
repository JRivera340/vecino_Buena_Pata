from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.enums import RolUsuarioEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token_para(db_session, username: str, rol: RolUsuarioEnum) -> str:
    usuario = Usuario(nombre=username, rol=rol, username=username, password_hash=hash_password("vbp2026"))
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject=username, rol=rol.value)


def test_crear_y_listar_comunidad(db_session):
    token = _token_para(db_session, "admin", RolUsuarioEnum.ADMIN)
    encabezados = {"Authorization": f"Bearer {token}"}

    respuesta_crear = client.post(
        "/api/v1/comunidades",
        json={
            "nombre": "Junta de Accion Comunal La Esperanza",
            "tipo": "ACCION_COMUNAL",
            "barrio": "La Esperanza",
            "telefono_contacto": "3001234567",
            "email_contacto": "contacto@laesperanza.org",
        },
        headers=encabezados,
    )
    assert respuesta_crear.status_code == 201
    creada = respuesta_crear.json()
    assert creada["activa"] is True

    respuesta_listar = client.get("/api/v1/comunidades", headers=encabezados)
    assert respuesta_listar.status_code == 200
    nombres = [c["nombre"] for c in respuesta_listar.json()]
    assert "Junta de Accion Comunal La Esperanza" in nombres


def test_listar_comunidades_sin_token_devuelve_401(db_session):
    respuesta = client.get("/api/v1/comunidades")
    assert respuesta.status_code == 401
