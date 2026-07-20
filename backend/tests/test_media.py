from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario

client = TestClient(app)


def test_usuario_autenticado_puede_subir_foto(db_session):
    usuario = Usuario(
        nombre="Maria", rol=RolUsuarioEnum.COMUNIDAD, username="maria.comunidad", password_hash=hash_password("vbp2026")
    )
    db_session.add(usuario)
    db_session.commit()
    token = create_access_token(subject="maria.comunidad", rol=RolUsuarioEnum.COMUNIDAD.value)

    respuesta = client.post(
        "/api/v1/media",
        files={"archivo": ("foto.jpg", b"contenido de prueba", "image/jpeg")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201
    assert respuesta.json()["ruta"].endswith(".jpg")


def test_subir_foto_sin_token_devuelve_401(db_session):
    respuesta = client.post("/api/v1/media", files={"archivo": ("foto.jpg", b"x", "image/jpeg")})
    assert respuesta.status_code == 401
