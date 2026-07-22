from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app

client = TestClient(app)


def test_login_responde_con_encabezado_cors_para_el_origen_del_frontend():
    origen = get_settings().frontend_base_url

    respuesta = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": origen,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert respuesta.status_code == 200
    assert respuesta.headers["access-control-allow-origin"] == origen
