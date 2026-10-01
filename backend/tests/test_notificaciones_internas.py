from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.notificacion_interna import NotificacionInterna
from app.models.usuario import Usuario

client = TestClient(app)


def _crear_animal(db_session) -> int:
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
    return animal.id


def test_listar_y_marcar_leida(db_session):
    lider = Usuario(nombre="Luis", rol=RolUsuarioEnum.LIDER, username="luis.lider", password_hash=hash_password("x"))
    db_session.add(lider)
    db_session.commit()
    animal_id = _crear_animal(db_session)
    notificacion = NotificacionInterna(animal_id=animal_id, origen_tipo="REPORTE", origen_id=1, usuario_id=lider.id)
    db_session.add(notificacion)
    db_session.commit()

    token = create_access_token(subject="luis.lider", rol="LIDER")
    respuesta = client.get("/api/v1/notificaciones", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    assert len(respuesta.json()) == 1
    assert respuesta.json()[0]["leida_en"] is None

    marcar = client.post(f"/api/v1/notificaciones/{notificacion.id}/leer", headers={"Authorization": f"Bearer {token}"})
    assert marcar.status_code == 200

    respuesta_2 = client.get("/api/v1/notificaciones", headers={"Authorization": f"Bearer {token}"})
    assert respuesta_2.json()[0]["leida_en"] is not None
