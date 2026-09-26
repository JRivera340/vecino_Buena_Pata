from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from tests.ayudas_inscripcion import crear_comunidad

client = TestClient(app)

COMUNIDAD_NUEVA = {
    "nombre": "Junta Las Cruces",
    "tipo": "ACCION_COMUNAL",
    "barrio": "Las Cruces",
    "telefono_contacto": "3001234567",
    "email_contacto": "junta@example.org",
}


def _encabezados(db, rol=RolUsuarioEnum.ADMIN, username="admin"):
    db.add(Usuario(nombre=username, rol=rol, username=username, password_hash=hash_password("vbp2026")))
    db.commit()
    return {"Authorization": f"Bearer {create_access_token(subject=username, rol=rol.value)}"}


def _lider(**cambios):
    datos = {
        "nombre": "Luis Lider",
        "username": "luis.lider",
        "password": "clave-segura-1",
        "rol": "LIDER",
        "tipo_documento": "CC",
        "numero_documento": "80.123.456",
        "comunidad_nueva": COMUNIDAD_NUEVA,
    }
    datos.update(cambios)
    return datos


def test_solo_el_admin_gestiona_usuarios(db_session):
    encabezados = _encabezados(db_session, RolUsuarioEnum.VETERINARIO, "vet")

    assert client.get("/api/v1/usuarios", headers=encabezados).status_code == 403
    assert client.post("/api/v1/usuarios", json=_lider(), headers=encabezados).status_code == 403


def test_crea_un_lider_con_documento_normalizado_y_su_comunidad(db_session):
    encabezados = _encabezados(db_session)

    respuesta = client.post("/api/v1/usuarios", json=_lider(), headers=encabezados)

    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["numero_documento"] == "80123456"
    assert cuerpo["comunidad_nombre"] == "Junta Las Cruces"
    assert "password" not in respuesta.text and "hash" not in respuesta.text
    comunidad = db_session.query(Comunidad).one()
    assert comunidad.lider_id == cuerpo["id"]


def test_el_lider_puede_iniciar_sesion(db_session):
    encabezados = _encabezados(db_session)
    client.post("/api/v1/usuarios", json=_lider(), headers=encabezados)

    respuesta = client.post("/api/v1/auth/login", data={"username": "luis.lider", "password": "clave-segura-1"})

    assert respuesta.status_code == 200 and respuesta.json()["rol"] == "LIDER"


def test_no_se_pueden_crear_dos_lideres_con_el_mismo_documento(db_session):
    encabezados = _encabezados(db_session)
    client.post("/api/v1/usuarios", json=_lider(), headers=encabezados)

    repetido = _lider(username="otro.lider", numero_documento="80123456", comunidad_nueva={**COMUNIDAD_NUEVA, "nombre": "Otra"})
    respuesta = client.post("/api/v1/usuarios", json=repetido, headers=encabezados)

    assert respuesta.status_code == 409


def test_un_lider_exige_documento_y_comunidad(db_session):
    encabezados = _encabezados(db_session)

    sin_documento = _lider(tipo_documento=None, numero_documento=None)
    sin_comunidad = _lider(username="sin.comunidad", numero_documento="99999999", comunidad_nueva=None)

    assert client.post("/api/v1/usuarios", json=sin_documento, headers=encabezados).status_code == 422
    assert client.post("/api/v1/usuarios", json=sin_comunidad, headers=encabezados).status_code == 422


def test_una_comunidad_no_puede_tener_dos_lideres(db_session):
    encabezados = _encabezados(db_session)
    comunidad = crear_comunidad(db_session)
    primero = _lider(comunidad_nueva=None, comunidad_id=comunidad.id)
    segundo = _lider(username="otro", numero_documento="70123456", comunidad_nueva=None, comunidad_id=comunidad.id)

    assert client.post("/api/v1/usuarios", json=primero, headers=encabezados).status_code == 201
    assert client.post("/api/v1/usuarios", json=segundo, headers=encabezados).status_code == 409


def test_otros_roles_no_exigen_documento(db_session):
    encabezados = _encabezados(db_session)

    respuesta = client.post(
        "/api/v1/usuarios",
        json={"nombre": "Vera", "username": "vera", "password": "clave-segura-1", "rol": "VETERINARIO"},
        headers=encabezados,
    )

    assert respuesta.status_code == 201


def test_edita_el_documento_sin_chocar_con_otro_usuario(db_session):
    encabezados = _encabezados(db_session)
    uno = client.post("/api/v1/usuarios", json=_lider(), headers=encabezados).json()
    client.post(
        "/api/v1/usuarios",
        json=_lider(username="dos", numero_documento="70123456", comunidad_nueva={**COMUNIDAD_NUEVA, "nombre": "Dos"}),
        headers=encabezados,
    )

    choque = client.patch(f"/api/v1/usuarios/{uno['id']}", json={"numero_documento": "70.123.456"}, headers=encabezados)
    libre = client.patch(f"/api/v1/usuarios/{uno['id']}", json={"numero_documento": "80.123.457", "nombre": "Luis L."}, headers=encabezados)

    assert choque.status_code == 409
    assert libre.status_code == 200 and libre.json()["numero_documento"] == "80123457"
