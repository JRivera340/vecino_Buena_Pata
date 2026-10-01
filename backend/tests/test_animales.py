from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token_para(db_session, username: str, rol: RolUsuarioEnum, comunidad_id: int | None = None) -> str:
    usuario = Usuario(
        nombre=username,
        rol=rol,
        username=username,
        password_hash=hash_password("vbp2026"),
        comunidad_id=comunidad_id,
    )
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
            "tipo_documento": "CC",
            "numero_documento": "1.020.304.050",
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
            "tipo_documento": "CC",
            "numero_documento": "1.020.304.050",
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
            "tipo_documento": "CC",
            "numero_documento": "1.020.304.050",
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


def test_sin_sesion_no_se_puede_inscribir_por_el_endpoint_interno(db_session):
    comunidad_id = _crear_comunidad(db_session)

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
    )

    assert respuesta.status_code == 401


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
            "tipo_documento": "CC",
            "numero_documento": "1.020.304.050",
        },
        headers=encabezados,
    ).json()

    respuesta_lista = client.get("/api/v1/animales", headers=encabezados)
    assert respuesta_lista.status_code == 200
    assert any(a["nombre"] == "Tribilin" for a in respuesta_lista.json())

    respuesta_detalle = client.get(f"/api/v1/animales/{creado['id']}", headers=encabezados)
    assert respuesta_detalle.status_code == 200
    assert respuesta_detalle.json()["nombre"] == "Tribilin"


def test_inscripcion_interna_rechaza_un_punto_fuera_de_bogota(db_session):
    token = _token_para(db_session, "vera", RolUsuarioEnum.VETERINARIO)
    comunidad_id = _crear_comunidad(db_session)

    respuesta = client.post(
        "/api/v1/animales",
        json={"nombre": "Lejos", "sexo": "MACHO", "tamano": "GRANDE", "barrio": "Laureles", "latitud": 6.2442, "longitud": -75.5812, "comunidad_id": comunidad_id},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 422


def test_inscribir_exige_cedula_de_quien_diligencia(db_session):
    token = _token_para(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    comunidad = Comunidad(
        nombre="Patitas del Sur", tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="El Poblado", telefono_contacto="3000000000", email_contacto="c@c.org",
    )
    db_session.add(comunidad)
    db_session.commit()

    respuesta = client.post(
        "/api/v1/animales",
        json={
            "nombre": "Toby", "sexo": "MACHO", "tamano": "MEDIANO",
            "barrio": "El Poblado", "latitud": 4.65, "longitud": -74.1,
            "comunidad_id": comunidad.id,
            "observacion_comportamiento": "Se deja acariciar sin problema.",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 422

    respuesta_ok = client.post(
        "/api/v1/animales",
        json={
            "nombre": "Toby", "sexo": "MACHO", "tamano": "MEDIANO",
            "barrio": "El Poblado", "latitud": 4.65, "longitud": -74.1,
            "comunidad_id": comunidad.id,
            "tipo_documento": "CC", "numero_documento": "1.020.304.050",
            "observacion_comportamiento": "Se deja acariciar sin problema.",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta_ok.status_code == 201
    assert respuesta_ok.json()["persona_id"] is not None


def test_mis_perritos_filtra_por_comunidad_del_usuario(db_session):
    comunidad_1 = _crear_comunidad(db_session)
    comunidad_2 = Comunidad(
        nombre="Huellitas del Norte",
        tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="La Candelaria",
        telefono_contacto="3001112233",
        email_contacto="contacto@huellitasdelnorte.org",
    )
    db_session.add(comunidad_2)
    db_session.commit()

    animal_1 = Animal(
        nombre="Firulais",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.MEDIANO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad_1,
        inscrito_por="maria.comunidad",
    )
    animal_2 = Animal(
        nombre="Luna",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.PEQUENO,
        barrio="La Candelaria",
        latitud=4.6,
        longitud=-74.08,
        comunidad_id=comunidad_2.id,
        inscrito_por="otra.comunidad",
    )
    db_session.add_all([animal_1, animal_2])
    db_session.commit()

    token = _token_para(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD, comunidad_id=comunidad_1)

    respuesta = client.get("/api/v1/animales/mis-perritos", headers={"Authorization": f"Bearer {token}"})

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert len(datos) == 1
    assert all(a["comunidad_id"] == comunidad_1 for a in datos)
