from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token(db_session, username: str, rol: RolUsuarioEnum) -> str:
    usuario = Usuario(nombre=username, rol=rol, username=username, password_hash=hash_password("vbp2026"))
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject=username, rol=rol.value)


def _crear_animal(db_session, estado=EstadoAnimalEnum.VBP_ACTIVO) -> int:
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
        nombre="Canela",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.PEQUENO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=estado,
    )
    db_session.add(animal)
    db_session.commit()
    return animal.id


def test_lider_registra_salida_por_adopcion(db_session):
    token = _token(db_session, "lider.campo", RolUsuarioEnum.LIDER)
    animal_id = _crear_animal(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/salida",
        json={"causal": "ADOPCION", "fecha": datetime.now(timezone.utc).isoformat(), "notas": "Familia del barrio."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["causal_salida"] == "ADOPCION"
    assert cuerpo["notas_salida"] == "Familia del barrio."
    assert cuerpo["estado"] == "ADOPTADO"


def test_salida_de_candidato_devuelve_409(db_session):
    token = _token(db_session, "lider.campo", RolUsuarioEnum.LIDER)
    animal_id = _crear_animal(db_session, estado=EstadoAnimalEnum.CANDIDATO)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/salida",
        json={"causal": "ADOPCION", "fecha": datetime.now(timezone.utc).isoformat(), "notas": None},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 409


def test_comunidad_no_puede_registrar_salida(db_session):
    token = _token(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    animal_id = _crear_animal(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/salida",
        json={"causal": "ADOPCION", "fecha": datetime.now(timezone.utc).isoformat(), "notas": None},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 403
