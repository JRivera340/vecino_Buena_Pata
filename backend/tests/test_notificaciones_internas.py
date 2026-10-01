from app.core.security import hash_password
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.usuario import Usuario
from app.services.notificaciones_internas import crear_notificaciones


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

    destinatarios = {(n.usuario_id, n.rol) for n in notificaciones}
    assert (None, "VETERINARIO") in destinatarios
    assert (None, "UNIDAD_ESPECIAL") in destinatarios
    lider = db_session.query(Usuario).filter_by(username="luis.lider").one()
    inscriptor = db_session.query(Usuario).filter_by(username="maria.comunidad").one()
    assert (lider.id, None) in destinatarios
    assert (inscriptor.id, None) in destinatarios


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
