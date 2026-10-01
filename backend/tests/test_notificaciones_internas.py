from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.notificacion_interna import NotificacionInterna
from app.models.usuario import Usuario
from app.services.notificaciones_internas import crear_notificaciones

client = TestClient(app)


def _preparar(db):
    lider = Usuario(nombre="Luis Lider", rol=RolUsuarioEnum.LIDER, username="luis.lider", password_hash=hash_password("x"))
    vet = Usuario(nombre="Dr Rojas", rol=RolUsuarioEnum.VETERINARIO, username="dr.rojas", password_hash=hash_password("x"))
    unidad = Usuario(nombre="UE", rol=RolUsuarioEnum.UNIDAD_ESPECIAL, username="unidad.especial", password_hash=hash_password("x"))
    db.add_all([lider, vet, unidad])
    db.flush()
    comunidad = Comunidad(
        nombre="Patitas", tipo=TipoComunidadEnum.PROTECCION_ANIMAL, barrio="X",
        telefono_contacto="300", email_contacto="c@c.org", lider_id=lider.id,
    )
    db.add(comunidad)
    db.flush()
    lider.comunidad_id = comunidad.id
    inscriptor = Usuario(nombre="Maria", rol=RolUsuarioEnum.COMUNIDAD, username="maria.comunidad", password_hash=hash_password("x"), comunidad_id=comunidad.id)
    db.add(inscriptor)
    db.flush()
    animal = Animal(
        nombre="Rocky", sexo=SexoEnum.MACHO, tamano=TamanoEnum.MEDIANO, barrio="X",
        latitud=4.6, longitud=-74.1, comunidad_id=comunidad.id, inscrito_por="maria.comunidad",
    )
    db.add(animal)
    db.commit()
    return animal


def test_notifica_veterinario_unidad_especial_lider_y_quien_inscribio(db_session):
    animal = _preparar(db_session)

    notificaciones = crear_notificaciones(db_session, animal=animal, origen_tipo="REPORTE", origen_id=1)

    destinatarios = {n.usuario_id for n in notificaciones}
    vet = db_session.query(Usuario).filter_by(username="dr.rojas").one()
    unidad = db_session.query(Usuario).filter_by(username="unidad.especial").one()
    lider = db_session.query(Usuario).filter_by(username="luis.lider").one()
    inscriptor = db_session.query(Usuario).filter_by(username="maria.comunidad").one()
    assert vet.id in destinatarios
    assert unidad.id in destinatarios
    assert lider.id in destinatarios
    assert inscriptor.id in destinatarios
    assert all(n.rol is None for n in notificaciones)


def test_una_fila_por_usuario_activo_del_rol_broadcast(db_session):
    lider = Usuario(nombre="Luis Lider", rol=RolUsuarioEnum.LIDER, username="luis.lider3", password_hash=hash_password("x"))
    vet1 = Usuario(nombre="Dr Rojas", rol=RolUsuarioEnum.VETERINARIO, username="dr.rojas2", password_hash=hash_password("x"))
    vet2 = Usuario(nombre="Dra Lopez", rol=RolUsuarioEnum.VETERINARIO, username="dra.lopez", password_hash=hash_password("x"))
    db_session.add_all([lider, vet1, vet2])
    db_session.flush()
    comunidad = Comunidad(
        nombre="Patitas2", tipo=TipoComunidadEnum.PROTECCION_ANIMAL, barrio="X",
        telefono_contacto="300", email_contacto="c2@c.org", lider_id=lider.id,
    )
    db_session.add(comunidad)
    db_session.flush()
    lider.comunidad_id = comunidad.id
    animal = Animal(
        nombre="Max", sexo=SexoEnum.MACHO, tamano=TamanoEnum.MEDIANO, barrio="X",
        latitud=4.6, longitud=-74.1, comunidad_id=comunidad.id, inscrito_por="desconocido",
    )
    db_session.add(animal)
    db_session.commit()

    notificaciones = crear_notificaciones(db_session, animal=animal, origen_tipo="REPORTE", origen_id=1)

    filas_vet = [n for n in notificaciones if n.usuario_id in (vet1.id, vet2.id)]
    assert len(filas_vet) == 2
    assert {n.usuario_id for n in filas_vet} == {vet1.id, vet2.id}


def test_marcar_leida_de_un_veterinario_no_afecta_a_otro(db_session):
    lider = Usuario(nombre="Luis Lider", rol=RolUsuarioEnum.LIDER, username="luis.lider4", password_hash=hash_password("x"))
    vet1 = Usuario(nombre="Dr Rojas", rol=RolUsuarioEnum.VETERINARIO, username="dr.rojas3", password_hash=hash_password("x"))
    vet2 = Usuario(nombre="Dra Lopez", rol=RolUsuarioEnum.VETERINARIO, username="dra.lopez2", password_hash=hash_password("x"))
    db_session.add_all([lider, vet1, vet2])
    db_session.flush()
    comunidad = Comunidad(
        nombre="Patitas3", tipo=TipoComunidadEnum.PROTECCION_ANIMAL, barrio="X",
        telefono_contacto="300", email_contacto="c3@c.org", lider_id=lider.id,
    )
    db_session.add(comunidad)
    db_session.flush()
    lider.comunidad_id = comunidad.id
    animal = Animal(
        nombre="Toby", sexo=SexoEnum.MACHO, tamano=TamanoEnum.MEDIANO, barrio="X",
        latitud=4.6, longitud=-74.1, comunidad_id=comunidad.id, inscrito_por="desconocido",
    )
    db_session.add(animal)
    db_session.commit()

    crear_notificaciones(db_session, animal=animal, origen_tipo="REPORTE", origen_id=1)

    notif_vet1 = db_session.query(NotificacionInterna).filter_by(usuario_id=vet1.id).one()
    notif_vet2 = db_session.query(NotificacionInterna).filter_by(usuario_id=vet2.id).one()

    token_vet1 = create_access_token(subject="dr.rojas3", rol="VETERINARIO")
    marcar = client.post(
        f"/api/v1/notificaciones/{notif_vet1.id}/leer", headers={"Authorization": f"Bearer {token_vet1}"}
    )
    assert marcar.status_code == 200

    db_session.refresh(notif_vet1)
    db_session.refresh(notif_vet2)
    assert notif_vet1.leida_en is not None
    assert notif_vet2.leida_en is None


def test_no_falla_si_no_hay_usuarios_del_rol(db_session):
    comunidad = Comunidad(
        nombre="Patitas", tipo=TipoComunidadEnum.PROTECCION_ANIMAL, barrio="X",
        telefono_contacto="300", email_contacto="c@c.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    animal = Animal(
        nombre="Rocky", sexo=SexoEnum.MACHO, tamano=TamanoEnum.MEDIANO, barrio="X",
        latitud=4.6, longitud=-74.1, comunidad_id=comunidad.id, inscrito_por="desconocido",
    )
    db_session.add(animal)
    db_session.commit()

    notificaciones = crear_notificaciones(db_session, animal=animal, origen_tipo="REPORTE", origen_id=1)
    assert notificaciones == []


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


def test_marcar_leida_de_otro_usuario_devuelve_403(db_session):
    lider = Usuario(nombre="Luis", rol=RolUsuarioEnum.LIDER, username="luis.lider2", password_hash=hash_password("x"))
    otro = Usuario(
        nombre="Marta", rol=RolUsuarioEnum.VETERINARIO, username="marta.veterinaria", password_hash=hash_password("x")
    )
    db_session.add_all([lider, otro])
    db_session.commit()
    animal_id = _crear_animal(db_session)
    notificacion = NotificacionInterna(animal_id=animal_id, origen_tipo="REPORTE", origen_id=1, usuario_id=lider.id)
    db_session.add(notificacion)
    db_session.commit()

    token_otro = create_access_token(subject="marta.veterinaria", rol="VETERINARIO")
    marcar = client.post(
        f"/api/v1/notificaciones/{notificacion.id}/leer", headers={"Authorization": f"Bearer {token_otro}"}
    )
    assert marcar.status_code == 403
