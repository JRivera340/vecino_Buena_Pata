from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token_para(db_session, username: str, rol: RolUsuarioEnum) -> str:
    usuario = Usuario(
        nombre=username, rol=rol, username=username, password_hash=hash_password("vbp2026"),
    )
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject=username, rol=rol.value)


def _crear_comunidad(db_session, nombre="Patitas del Sur") -> int:
    comunidad = Comunidad(
        nombre=nombre, tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="El Poblado", telefono_contacto="3009876543", email_contacto="c@c.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    return comunidad.id


def _crear_animal_incompleto(db_session) -> Animal:
    animal = Animal(
        nombre="Historico", sexo=SexoEnum.MACHO, tamano=TamanoEnum.MEDIANO,
        barrio="El Poblado", latitud=4.65, longitud=-74.1, inscrito_por="importacion_csv",
    )
    db_session.add(animal)
    db_session.commit()
    return animal


def test_completar_comunidad_y_documento_de_un_animal_incompleto(db_session):
    token = _token_para(db_session, "lider.campo", RolUsuarioEnum.LIDER)
    comunidad_id = _crear_comunidad(db_session)
    animal = _crear_animal_incompleto(db_session)
    assert animal.comunidad_id is None
    assert animal.persona_id is None

    respuesta = client.patch(
        f"/api/v1/animales/{animal.id}",
        json={"comunidad_id": comunidad_id, "tipo_documento": "CC", "numero_documento": "1.020.304.050"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["comunidad_id"] == comunidad_id
    assert cuerpo["persona_id"] is not None
    assert cuerpo["incompleto"] is False


def test_actualizar_animal_inexistente_devuelve_404(db_session):
    token = _token_para(db_session, "admin.vbp", RolUsuarioEnum.ADMIN)

    respuesta = client.patch(
        "/api/v1/animales/999999",
        json={"comunidad_id": 1},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 404


def test_veterinario_no_puede_actualizar_un_animal(db_session):
    token = _token_para(db_session, "dr.rojas", RolUsuarioEnum.VETERINARIO)
    animal = _crear_animal_incompleto(db_session)

    respuesta = client.patch(
        f"/api/v1/animales/{animal.id}",
        json={"observacion_comportamiento": "Tranquilo."},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 403
