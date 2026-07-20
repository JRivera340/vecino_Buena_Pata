from fastapi.testclient import TestClient

from app.main import app
from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import SexoEnum, TamanoEnum, TipoComunidadEnum

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


def test_consultar_codigo_inexistente_devuelve_404(db_session):
    respuesta = client.get("/api/v1/publico/animales/codigo-que-no-existe")
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
