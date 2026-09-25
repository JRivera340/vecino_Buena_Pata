from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token_para(db_session, username: str, rol: RolUsuarioEnum) -> str:
    usuario = Usuario(nombre=username, rol=rol, username=username, password_hash=hash_password("vbp2026"))
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject=username, rol=rol.value)


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


def test_inscribir_animal_queda_como_candidato(db_session):
    token = _token_para(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    comunidad_id = _crear_comunidad(db_session)
    encabezados = {"Authorization": f"Bearer {token}"}

    respuesta = client.post(
        "/api/v1/animales",
        json={
            "nombre": "Estrella",
            "sexo": "HEMBRA",
            "tamano": "PEQUENO",
            "barrio": "El Poblado",
            "latitud": 4.65,
            "longitud": -74.1,
            "comunidad_id": comunidad_id,
        },
        headers=encabezados,
    )
    assert respuesta.status_code == 201
    creado = respuesta.json()
    assert creado["estado"] == "CANDIDATO"
    assert creado["esterilizado"] is False
    assert creado["inscrito_por"] == "maria.comunidad"


def test_inscribir_animal_sin_especie_asume_perro(db_session):
    token = _token_para(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    comunidad_id = _crear_comunidad(db_session)

    respuesta = client.post(
        "/api/v1/animales",
        json={
            "nombre": "Rocky",
            "sexo": "MACHO",
            "tamano": "MEDIANO",
            "barrio": "El Poblado",
            "latitud": 4.65,
            "longitud": -74.1,
            "comunidad_id": comunidad_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 201
    assert respuesta.json()["especie"] == "PERRO"


def test_inscribir_gato_guarda_la_especie(db_session):
    token = _token_para(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    comunidad_id = _crear_comunidad(db_session)

    respuesta = client.post(
        "/api/v1/animales",
        json={
            "nombre": "Nube",
            "especie": "GATO",
            "sexo": "HEMBRA",
            "tamano": "PEQUENO",
            "barrio": "El Poblado",
            "latitud": 4.65,
            "longitud": -74.1,
            "comunidad_id": comunidad_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 201
    assert respuesta.json()["especie"] == "GATO"


def test_inscribir_con_una_especie_desconocida_devuelve_422(db_session):
    token = _token_para(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    comunidad_id = _crear_comunidad(db_session)

    respuesta = client.post(
        "/api/v1/animales",
        json={
            "nombre": "Raro",
            "especie": "LORO",
            "sexo": "MACHO",
            "tamano": "PEQUENO",
            "barrio": "El Poblado",
            "latitud": 4.65,
            "longitud": -74.1,
            "comunidad_id": comunidad_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 422


def test_unidad_especial_no_puede_inscribir_animal(db_session):
    token = _token_para(db_session, "unidad.especial", RolUsuarioEnum.UNIDAD_ESPECIAL)
    comunidad_id = _crear_comunidad(db_session)
    encabezados = {"Authorization": f"Bearer {token}"}

    respuesta = client.post(
        "/api/v1/animales",
        json={
            "nombre": "Duque",
            "sexo": "MACHO",
            "tamano": "GRANDE",
            "barrio": "El Poblado",
            "latitud": 4.65,
            "longitud": -74.1,
            "comunidad_id": comunidad_id,
        },
        headers=encabezados,
    )
    assert respuesta.status_code == 403


def test_listar_y_obtener_animal(db_session):
    token = _token_para(db_session, "dr.rojas", RolUsuarioEnum.VETERINARIO)
    comunidad_id = _crear_comunidad(db_session)
    encabezados = {"Authorization": f"Bearer {token}"}

    creado = client.post(
        "/api/v1/animales",
        json={
            "nombre": "Tribilin",
            "sexo": "MACHO",
            "tamano": "MEDIANO",
            "barrio": "El Poblado",
            "latitud": 4.65,
            "longitud": -74.1,
            "comunidad_id": comunidad_id,
        },
        headers=encabezados,
    ).json()

    respuesta_lista = client.get("/api/v1/animales", headers=encabezados)
    assert respuesta_lista.status_code == 200
    assert any(a["nombre"] == "Tribilin" for a in respuesta_lista.json())

    respuesta_detalle = client.get(f"/api/v1/animales/{creado['id']}", headers=encabezados)
    assert respuesta_detalle.status_code == 200
    assert respuesta_detalle.json()["nombre"] == "Tribilin"
