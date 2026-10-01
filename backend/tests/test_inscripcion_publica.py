from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from tests.ayudas_inscripcion import crear_comunidad, inscribir_animal_de_prueba

client = TestClient(app)


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
    inscribir_animal_de_prueba(db_session, comunidad.id, nombre="Copito")
    inscribir_animal_de_prueba(db_session, comunidad.id, nombre="Canela", latitud=4.7)

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


def test_la_localidad_calculada_sale_en_la_lista_del_inscriptor(db_session):
    comunidad = crear_comunidad(db_session)
    inscribir_animal_de_prueba(db_session, comunidad.id, latitud=4.6021, longitud=-74.0691)

    respuesta = client.post(
        "/api/v1/publico/inscriptores/verificar", json={"tipo_documento": "CC", "numero_documento": "1234567"}
    )

    assert respuesta.json()["animales"][0]["localidad"] == "Santa Fe"
