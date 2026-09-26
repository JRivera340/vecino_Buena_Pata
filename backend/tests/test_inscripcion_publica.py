import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import get_settings
from app.main import app
from app.models.animal import Animal
from app.models.enums import EstadoAnimalEnum
from app.models.persona import Persona
from tests.ayudas_inscripcion import crear_comunidad

client = TestClient(app)


@pytest.fixture(autouse=True)
def _almacenamiento_temporal(tmp_path, monkeypatch):
    monkeypatch.setattr(get_settings(), "media_root", tmp_path)


def _foto(nombre="foto.jpg", tipo="image/jpeg"):
    salida = io.BytesIO()
    Image.new("RGB", (8, 8), "white").save(salida, format="JPEG")
    return ("foto", (nombre, salida.getvalue(), tipo))


def _formulario(comunidad_id, **cambios):
    datos = {
        "tipo_documento": "CC",
        "numero_documento": "1.234.567",
        "nombre_persona": "Ana Perez",
        "telefono": "3001234567",
        "correo": "ana@example.org",
        "acepta_datos": "true",
        "nombre": "Copito",
        "especie": "PERRO",
        "sexo": "MACHO",
        "tamano": "PEQUENO",
        "barrio": "Las Cruces",
        "latitud": "4.6",
        "longitud": "-74.08",
        "comunidad_id": str(comunidad_id),
    }
    datos.update(cambios)
    return datos


def _inscribir(comunidad_id, cambios=None, foto=None):
    return client.post(
        "/api/v1/publico/inscripciones",
        data=_formulario(comunidad_id, **(cambios or {})),
        files=[foto or _foto()],
    )


def test_una_persona_sin_cuenta_inscribe_un_animal_como_candidato(db_session):
    comunidad = crear_comunidad(db_session)

    respuesta = _inscribir(comunidad.id)

    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["estado"] == "CANDIDATO"
    assert cuerpo["radicado"].startswith("VBP-") and cuerpo["radicado"].endswith(f"{cuerpo['animal_id']:06d}")
    animal = db_session.get(Animal, cuerpo["animal_id"])
    assert animal.estado == EstadoAnimalEnum.CANDIDATO
    assert animal.comunidad_id == comunidad.id
    assert animal.persona_id is not None
    assert animal.inscrito_por == "publico"


def test_el_mismo_documento_con_y_sin_puntos_es_la_misma_persona(db_session):
    comunidad = crear_comunidad(db_session)

    _inscribir(comunidad.id, {"numero_documento": "1.234.567", "nombre": "Copito"})
    _inscribir(comunidad.id, {"numero_documento": "1234567", "nombre": "Canela", "latitud": "4.7"})

    assert db_session.query(Persona).count() == 1
    assert db_session.query(Animal).count() == 2


def test_un_documento_ajeno_no_cambia_el_contacto_de_la_persona(db_session):
    comunidad = crear_comunidad(db_session)
    _inscribir(comunidad.id)

    _inscribir(comunidad.id, {"correo": "otra@example.org", "telefono": "3999999999", "nombre": "Otro", "latitud": "4.7"})

    persona = db_session.query(Persona).one()
    assert persona.correo == "ana@example.org"
    assert persona.telefono == "3001234567"


def test_rechaza_si_no_acepta_el_tratamiento_de_datos(db_session):
    comunidad = crear_comunidad(db_session)

    respuesta = _inscribir(comunidad.id, {"acepta_datos": "false"})

    assert respuesta.status_code == 400
    assert db_session.query(Animal).count() == 0


def test_rechaza_una_comunidad_que_no_existe(db_session):
    respuesta = _inscribir(999)

    assert respuesta.status_code == 422


def test_rechaza_un_archivo_que_no_es_imagen(db_session):
    comunidad = crear_comunidad(db_session)

    respuesta = _inscribir(comunidad.id, foto=("foto", ("nota.txt", b"hola", "text/plain")))

    assert respuesta.status_code == 400


def test_rechaza_un_correo_con_formato_invalido(db_session):
    comunidad = crear_comunidad(db_session)

    assert _inscribir(comunidad.id, {"correo": "no-es-correo"}).status_code == 422


def test_rechaza_un_documento_demasiado_corto(db_session):
    comunidad = crear_comunidad(db_session)

    assert _inscribir(comunidad.id, {"numero_documento": "12"}).status_code == 422


def test_el_campo_trampa_lleno_no_guarda_nada(db_session):
    comunidad = crear_comunidad(db_session)

    respuesta = _inscribir(comunidad.id, {"sitio_web": "http://spam.example"})

    assert respuesta.status_code == 201
    assert db_session.query(Animal).count() == 0
    assert db_session.query(Persona).count() == 0


def test_marca_un_posible_duplicado_cercano_con_el_mismo_nombre(db_session):
    comunidad = crear_comunidad(db_session)
    primero = _inscribir(comunidad.id).json()["animal_id"]

    segundo = _inscribir(comunidad.id, {"numero_documento": "9876543"}).json()["animal_id"]

    assert db_session.get(Animal, segundo).posible_duplicado_de_id == primero


def test_supera_el_limite_de_inscripciones_por_hora(db_session, monkeypatch):
    monkeypatch.setattr(get_settings(), "limite_inscripciones_por_hora", 2)
    comunidad = crear_comunidad(db_session)

    codigos = [_inscribir(comunidad.id, {"nombre": f"Animal {i}", "latitud": str(4.6 + i / 10)}).status_code for i in range(3)]

    assert codigos == [201, 201, 429]


def test_las_comunidades_publicas_no_traen_contactos(db_session):
    crear_comunidad(db_session)

    respuesta = client.get("/api/v1/publico/comunidades")

    assert respuesta.status_code == 200
    assert set(respuesta.json()[0]) == {"id", "nombre", "tipo", "barrio"}


def test_verificar_sin_inscripciones_previas(db_session):
    respuesta = client.post(
        "/api/v1/publico/inscriptores/verificar", json={"tipo_documento": "CC", "numero_documento": "555.666.777"}
    )

    assert respuesta.status_code == 200
    assert respuesta.json() == {"total": 0, "animales": []}


def test_verificar_lista_los_animales_del_mas_reciente_al_mas_antiguo_sin_datos_personales(db_session):
    comunidad = crear_comunidad(db_session)
    _inscribir(comunidad.id, {"nombre": "Copito"})
    _inscribir(comunidad.id, {"nombre": "Canela", "latitud": "4.7"})

    respuesta = client.post(
        "/api/v1/publico/inscriptores/verificar", json={"tipo_documento": "CC", "numero_documento": "1234567"}
    )

    cuerpo = respuesta.json()
    assert cuerpo["total"] == 2
    assert [a["nombre"] for a in cuerpo["animales"]] == ["Canela", "Copito"]
    texto = respuesta.text
    for prohibido in ("Ana Perez", "3001234567", "ana@example.org", "latitud", "longitud", "codigo"):
        assert prohibido not in texto


def test_verificar_supera_el_limite_por_minuto(db_session, monkeypatch):
    monkeypatch.setattr(get_settings(), "limite_verificar_por_minuto", 2)
    cuerpo = {"tipo_documento": "CC", "numero_documento": "1234567"}

    codigos = [client.post("/api/v1/publico/inscriptores/verificar", json=cuerpo).status_code for _ in range(3)]

    assert codigos == [200, 200, 429]
    assert client.post("/api/v1/publico/inscriptores/verificar", json=cuerpo).headers["Retry-After"] == "60"


def test_el_limite_usa_la_ultima_ip_del_encabezado_del_proxy(db_session, monkeypatch):
    monkeypatch.setattr(get_settings(), "limite_verificar_por_minuto", 1)
    cuerpo = {"tipo_documento": "CC", "numero_documento": "1234567"}

    def con_ip(ip_cliente):
        return client.post(
            "/api/v1/publico/inscriptores/verificar", json=cuerpo, headers={"X-Forwarded-For": f"9.9.9.9, {ip_cliente}"}
        ).status_code

    assert [con_ip("1.1.1.1"), con_ip("1.1.1.1"), con_ip("2.2.2.2")] == [200, 429, 200]


def test_rechaza_un_punto_fuera_de_bogota(db_session):
    comunidad = crear_comunidad(db_session)

    respuesta = _inscribir(comunidad.id, {"latitud": "6.2442", "longitud": "-75.5812"})

    assert respuesta.status_code == 422
    assert "fuera de Bogota" in respuesta.json()["detail"]
    assert db_session.query(Animal).count() == 0


def test_la_localidad_calculada_sale_en_la_lista_del_inscriptor(db_session):
    comunidad = crear_comunidad(db_session)
    _inscribir(comunidad.id, {"latitud": "4.6021", "longitud": "-74.0691"})

    respuesta = client.post(
        "/api/v1/publico/inscriptores/verificar", json={"tipo_documento": "CC", "numero_documento": "1234567"}
    )

    assert respuesta.json()["animales"][0]["localidad"] == "Santa Fe"
