from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import CausalSalidaEnum, EstadoAnimalEnum, RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token_veterinario(db_session) -> str:
    usuario = Usuario(
        nombre="Dr. Rojas", rol=RolUsuarioEnum.VETERINARIO, username="dr.rojas", password_hash=hash_password("vbp2026")
    )
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject="dr.rojas", rol=RolUsuarioEnum.VETERINARIO.value)


def _crear_animal_perdido(db_session) -> int:
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
        nombre="Lola",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.PEQUENO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=EstadoAnimalEnum.PERDIDO,
        causal_salida=CausalSalidaEnum.PERDIDA,
        fecha_salida=_ahora(),
    )
    db_session.add(animal)
    db_session.commit()
    return animal.id


def _ahora():
    return datetime.now(timezone.utc)


def test_veterinario_reactiva_animal_perdido(db_session):
    token = _token_veterinario(db_session)
    animal_id = _crear_animal_perdido(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/reactivacion",
        json={"estado_salud": "BUENO", "estado_comportamiento": "Reaparecio tranquilo"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["estado"] == "VBP_ACTIVO"
    assert cuerpo["causal_salida"] is None


def test_reactivar_animal_no_perdido_devuelve_409(db_session):
    token = _token_veterinario(db_session)
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
        nombre="Duque",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.GRANDE,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=EstadoAnimalEnum.CANDIDATO,
    )
    db_session.add(animal)
    db_session.commit()

    respuesta = client.post(
        f"/api/v1/animales/{animal.id}/reactivacion",
        json={"estado_salud": "BUENO", "estado_comportamiento": "Tranquilo"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 409


def test_lider_no_puede_reactivar(db_session):
    usuario = Usuario(
        nombre="Lider", rol=RolUsuarioEnum.LIDER, username="lider.campo", password_hash=hash_password("vbp2026")
    )
    db_session.add(usuario)
    db_session.commit()
    token = create_access_token(subject="lider.campo", rol=RolUsuarioEnum.LIDER.value)
    animal_id = _crear_animal_perdido(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/reactivacion",
        json={"estado_salud": "BUENO", "estado_comportamiento": "Tranquilo"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 403
