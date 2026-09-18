from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.usuario import Usuario

client = TestClient(app)


def _token_y_animal(db_session, con_collar: bool):
    usuario = Usuario(
        nombre="Lider", rol=RolUsuarioEnum.LIDER, username="lider.campo", password_hash=hash_password("vbp2026")
    )
    db_session.add(usuario)
    db_session.commit()
    token = create_access_token(subject="lider.campo", rol=RolUsuarioEnum.LIDER.value)

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
        nombre="Estrella",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.PEQUENO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
    )
    db_session.add(animal)
    db_session.commit()

    if con_collar:
        db_session.add(CollarQr(animal_id=animal.id, codigo="vbp-abc123"))
        db_session.commit()

    return token, animal.id


def test_descargar_qr_de_animal_con_collar(db_session):
    token, animal_id = _token_y_animal(db_session, con_collar=True)

    respuesta = client.get(f"/api/v1/animales/{animal_id}/collar/qr.png", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    assert respuesta.headers["content-type"] == "image/png"
    assert respuesta.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_qr_de_animal_sin_collar_devuelve_404(db_session):
    token, animal_id = _token_y_animal(db_session, con_collar=False)

    respuesta = client.get(f"/api/v1/animales/{animal_id}/collar/qr.png", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 404


def test_qr_de_collar_inactivo_devuelve_409(db_session):
    token, animal_id = _token_y_animal(db_session, con_collar=False)
    db_session.add(CollarQr(animal_id=animal_id, codigo="vbp-abc123", activo=False))
    db_session.commit()

    respuesta = client.get(f"/api/v1/animales/{animal_id}/collar/qr.png", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 409
