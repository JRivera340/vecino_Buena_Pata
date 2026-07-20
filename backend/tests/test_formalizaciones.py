from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum, VeredictoValidacionEnum
from app.models.usuario import Usuario
from app.models.validacion import Validacion

client = TestClient(app)


def _token(db_session, username: str, rol: RolUsuarioEnum) -> str:
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


def _crear_animal_listo_para_formalizar(db_session) -> int:
    comunidad_id = _crear_comunidad(db_session)
    animal = Animal(
        nombre="Canela",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.PEQUENO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad_id,
        inscrito_por="maria.comunidad",
        esterilizado=True,
        numero_microchip="985141900010",
    )
    db_session.add(animal)
    db_session.commit()
    db_session.add(
        Validacion(
            animal_id=animal.id,
            veterinario="dr.rojas",
            veredicto=VeredictoValidacionEnum.APROBADO,
            pendientes=[],
            observaciones="Cumple todo.",
        )
    )
    db_session.commit()
    return animal.id


def test_lider_formaliza_animal_listo(db_session):
    token = _token(db_session, "lider.campo", RolUsuarioEnum.LIDER)
    animal_id = _crear_animal_listo_para_formalizar(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/formalizacion",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["estado"] == "VBP_ACTIVO"
    assert cuerpo["codigo_collar"].startswith("vbp-")


def test_formalizacion_falla_sin_cumplir_criterios(db_session):
    token = _token(db_session, "lider.campo", RolUsuarioEnum.LIDER)
    comunidad_id = _crear_comunidad(db_session)
    animal = Animal(
        nombre="Duque",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.GRANDE,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad_id,
        inscrito_por="maria.comunidad",
    )
    db_session.add(animal)
    db_session.commit()

    respuesta = client.post(
        f"/api/v1/animales/{animal.id}/formalizacion",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 409


def test_admin_tambien_puede_formalizar(db_session):
    token = _token(db_session, "admin", RolUsuarioEnum.ADMIN)
    animal_id = _crear_animal_listo_para_formalizar(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/formalizacion",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201


def test_veterinario_no_puede_formalizar(db_session):
    token = _token(db_session, "dr.rojas", RolUsuarioEnum.VETERINARIO)
    animal_id = _crear_animal_listo_para_formalizar(db_session)

    respuesta = client.post(
        f"/api/v1/animales/{animal_id}/formalizacion",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 403
