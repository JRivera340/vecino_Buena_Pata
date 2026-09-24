from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from tests.ayudas_mapa_publico import crear_animal, crear_visita

client = TestClient(app)


def _crear_animal_con_collar(db_session) -> tuple[int, str]:
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
    )
    db_session.add(animal)
    db_session.commit()
    db_session.add(CollarQr(animal_id=animal.id, codigo="vbp-abc123"))
    db_session.commit()
    return animal.id, "vbp-abc123"


def test_consultar_animal_publico_sin_token(db_session):
    _, codigo = _crear_animal_con_collar(db_session)

    respuesta = client.get(f"/api/v1/publico/animales/{codigo}")
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["nombre"] == "Rocky"
    assert "inscrito_por" not in cuerpo
    assert "numero_microchip" not in cuerpo
    assert "esterilizado" not in cuerpo
    assert "comunidad_id" not in cuerpo


def test_consultar_codigo_inexistente_devuelve_404(db_session):
    respuesta = client.get("/api/v1/publico/animales/codigo-que-no-existe")
    assert respuesta.status_code == 404


def test_consultar_collar_inactivo_devuelve_404(db_session):
    animal_id, codigo = _crear_animal_con_collar(db_session)
    collar = db_session.query(CollarQr).filter_by(animal_id=animal_id).first()
    collar.activo = False
    db_session.commit()

    respuesta = client.get(f"/api/v1/publico/animales/{codigo}")
    assert respuesta.status_code == 404


def test_crear_reporte_publico_sin_token(db_session):
    animal_id, codigo = _crear_animal_con_collar(db_session)

    respuesta = client.post(
        f"/api/v1/publico/animales/{codigo}/reportes",
        json={"reportante_nombre": "Vecino anonimo", "descripcion": "No esta comiendo hace dos dias."},
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["animal_id"] == animal_id
    assert cuerpo["estado"] == "NUEVO"


def test_crear_reporte_con_descripcion_demasiado_larga_devuelve_422(db_session):
    _, codigo = _crear_animal_con_collar(db_session)

    respuesta = client.post(
        f"/api/v1/publico/animales/{codigo}/reportes",
        json={"reportante_nombre": "Vecino anonimo", "descripcion": "x" * 1001},
    )
    assert respuesta.status_code == 422


def test_mapa_publico_sin_token_lista_solo_animales_activos(db_session):
    activo = crear_animal(db_session, nombre="Activo")
    crear_animal(db_session, nombre="Candidato", estado=EstadoAnimalEnum.CANDIDATO)

    respuesta = client.get("/api/v1/publico/mapa")

    assert respuesta.status_code == 200
    assert [item["id"] for item in respuesta.json()] == [activo.id]


def test_mapa_publico_no_expone_codigo_ni_datos_internos(db_session):
    crear_animal(db_session, numero_microchip="985112345678901")

    respuesta = client.get("/api/v1/publico/mapa")
    texto = respuesta.text

    assert respuesta.status_code == 200
    assert "vbp-prueba" not in texto
    assert "codigo" not in texto
    assert "inscrito_por" not in texto
    assert "comunidad_id" not in texto
    assert "985112345678901" not in texto


def test_mapa_publico_devuelve_coordenadas_aproximadas(db_session):
    crear_animal(db_session, latitud=4.6097, longitud=-74.0817)

    (item,) = client.get("/api/v1/publico/mapa").json()

    assert item["latitud"] == 4.6095
    assert item["longitud"] == -74.0805


def test_mapa_publico_incluye_cabecera_de_cache(db_session):
    respuesta = client.get("/api/v1/publico/mapa")

    assert respuesta.headers["cache-control"] == "public, max-age=60"


def test_mapa_publico_sin_animales_devuelve_lista_vacia(db_session):
    respuesta = client.get("/api/v1/publico/mapa")

    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_hoja_de_vida_publica_sin_token(db_session):
    animal = crear_animal(db_session, nombre="Lulu", numero_microchip="985112345678901")
    crear_visita(db_session, animal.id, datetime(2026, 5, 1, tzinfo=timezone.utc), peso_kg=22.5)

    respuesta = client.get(f"/api/v1/publico/animales/{animal.id}/hoja-vida")

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["nombre"] == "Lulu"
    assert cuerpo["tiene_microchip"] is True
    assert cuerpo["ultima_visita"]["peso_kg"] == 22.5
    assert "985112345678901" not in respuesta.text
    assert "Nota interna" not in respuesta.text
    assert "inscrito_por" not in cuerpo
    assert "latitud" not in cuerpo


def test_hoja_de_vida_publica_de_animal_no_activo_devuelve_404(db_session):
    candidato = crear_animal(db_session, estado=EstadoAnimalEnum.CANDIDATO)

    respuesta = client.get(f"/api/v1/publico/animales/{candidato.id}/hoja-vida")

    assert respuesta.status_code == 404


def test_hoja_de_vida_publica_con_collar_inactivo_devuelve_404(db_session):
    animal = crear_animal(db_session, collar_activo=False)

    respuesta = client.get(f"/api/v1/publico/animales/{animal.id}/hoja-vida")

    assert respuesta.status_code == 404


def test_hoja_de_vida_publica_inexistente_devuelve_404(db_session):
    respuesta = client.get("/api/v1/publico/animales/9999/hoja-vida")

    assert respuesta.status_code == 404


def test_hoja_de_vida_publica_con_id_no_entero_devuelve_422(db_session):
    respuesta = client.get("/api/v1/publico/animales/abc/hoja-vida")

    assert respuesta.status_code == 422


def test_ficha_del_qr_ya_no_incluye_coordenadas(db_session):
    _, codigo = _crear_animal_con_collar(db_session)

    cuerpo = client.get(f"/api/v1/publico/animales/{codigo}").json()

    assert "latitud" not in cuerpo
    assert "longitud" not in cuerpo
