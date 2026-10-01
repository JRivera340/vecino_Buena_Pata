from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, EstadoSaludEnum, RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.evento_historial import EventoHistorial
from app.models.notificacion_interna import NotificacionInterna
from app.models.usuario import Usuario
from app.services.seguimiento import registrar_visita
from app.services.seguimiento_estado import calcular_estado_seguimiento

client = TestClient(app)

AHORA = datetime(2026, 9, 30, tzinfo=timezone.utc)


def _token(db_session, username: str, rol: RolUsuarioEnum) -> str:
    usuario = Usuario(nombre=username, rol=rol, username=username, password_hash=hash_password("vbp2026"))
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject=username, rol=rol.value)


def _crear_animal(db_session, estado=EstadoAnimalEnum.VBP_ACTIVO) -> Animal:
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
        tamano=TamanoEnum.MEDIANO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=estado,
        esterilizado=True,
        numero_microchip="985141900004",
    )
    db_session.add(animal)
    db_session.commit()
    return animal


def test_registrar_visita_en_animal_vbp_activo(db_session):
    animal = _crear_animal(db_session)

    visita = registrar_visita(
        db_session,
        animal_id=animal.id,
        responsable="dr.rojas",
        estado_salud=EstadoSaludEnum.BUENO,
        estado_comportamiento="Tranquilo con la comunidad",
        peso_kg=14.0,
    )

    assert visita.id is not None
    assert visita.animal_id == animal.id

    eventos = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).all()
    assert any(e.tipo_evento == "VISITA_SEGUIMIENTO" for e in eventos)


def test_registrar_visita_con_salud_regular_genera_notificacion(db_session):
    _token(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    animal = _crear_animal(db_session)

    visita = registrar_visita(
        db_session,
        animal_id=animal.id,
        responsable="dr.rojas",
        estado_salud=EstadoSaludEnum.REGULAR,
        estado_comportamiento="Nervioso",
        peso_kg=14.0,
    )

    notificaciones = (
        db_session.query(NotificacionInterna)
        .filter_by(animal_id=animal.id, origen_tipo="VISITA_PREOCUPANTE", origen_id=visita.id)
        .all()
    )
    assert len(notificaciones) > 0


def test_registrar_visita_con_salud_buena_no_genera_notificacion(db_session):
    _token(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    animal = _crear_animal(db_session)

    registrar_visita(
        db_session,
        animal_id=animal.id,
        responsable="dr.rojas",
        estado_salud=EstadoSaludEnum.BUENO,
        estado_comportamiento="Tranquilo",
        peso_kg=14.0,
    )

    notificaciones = (
        db_session.query(NotificacionInterna).filter_by(animal_id=animal.id, origen_tipo="VISITA_PREOCUPANTE").all()
    )
    assert len(notificaciones) == 0


def test_no_se_puede_registrar_visita_a_un_candidato(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.CANDIDATO)

    with pytest.raises(ValueError):
        registrar_visita(
            db_session,
            animal_id=animal.id,
            responsable="dr.rojas",
            estado_salud=EstadoSaludEnum.BUENO,
            estado_comportamiento="Tranquilo",
        )


def test_no_se_puede_registrar_visita_a_un_fallecido(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.FALLECIDO)

    with pytest.raises(ValueError):
        registrar_visita(
            db_session,
            animal_id=animal.id,
            responsable="dr.rojas",
            estado_salud=EstadoSaludEnum.BUENO,
            estado_comportamiento="Tranquilo",
        )


def test_marcar_en_camino_y_que_se_limpie_al_visitar(db_session):
    from app.models.animal import Animal
    from app.models.comunidad import Comunidad
    from app.models.enums import EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoComunidadEnum

    comunidad = Comunidad(
        nombre="Patitas", tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="X", telefono_contacto="300", email_contacto="c@c.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    animal = Animal(
        nombre="Rocky", sexo=SexoEnum.MACHO, tamano=TamanoEnum.MEDIANO,
        barrio="X", latitud=4.6, longitud=-74.1, comunidad_id=comunidad.id,
        estado=EstadoAnimalEnum.VBP_ACTIVO, inscrito_por="maria.comunidad",
    )
    db_session.add(animal)
    db_session.commit()

    from app.services.seguimiento import cancelar_en_camino, marcar_en_camino, registrar_visita

    marcar_en_camino(db_session, animal_id=animal.id, responsable="unidad.especial")
    db_session.refresh(animal)
    assert animal.visita_en_camino_por == "unidad.especial"

    with pytest.raises(ValueError):
        marcar_en_camino(db_session, animal_id=animal.id, responsable="otra.persona")

    from app.models.enums import EstadoSaludEnum
    registrar_visita(
        db_session, animal_id=animal.id, responsable="unidad.especial",
        estado_salud=EstadoSaludEnum.BUENO, estado_comportamiento="Tranquilo",
    )
    db_session.refresh(animal)
    assert animal.visita_en_camino_por is None


def test_admin_puede_cancelar_en_camino_de_otro(db_session):
    from app.services.seguimiento import cancelar_en_camino, marcar_en_camino

    animal = _crear_animal(db_session)
    marcar_en_camino(db_session, animal_id=animal.id, responsable="unidad.especial")

    cancelar_en_camino(db_session, animal_id=animal.id, responsable="admin.principal", es_admin=True)
    db_session.refresh(animal)
    assert animal.visita_en_camino_por is None


def test_no_admin_no_puede_cancelar_en_camino_de_otro(db_session):
    from app.services.seguimiento import cancelar_en_camino, marcar_en_camino

    animal = _crear_animal(db_session)
    marcar_en_camino(db_session, animal_id=animal.id, responsable="unidad.especial")

    with pytest.raises(ValueError):
        cancelar_en_camino(db_session, animal_id=animal.id, responsable="otra.persona", es_admin=False)
    db_session.refresh(animal)
    assert animal.visita_en_camino_por == "unidad.especial"


def test_estado_al_dia_recien_formalizado():
    estado = calcular_estado_seguimiento(
        fecha_formalizacion=AHORA - timedelta(days=10),
        fecha_ultima_visita=None,
        en_camino_por=None,
        ahora=AHORA,
    )
    assert estado == "AL_DIA"


def test_estado_proximo_a_vencer():
    estado = calcular_estado_seguimiento(
        fecha_formalizacion=AHORA - timedelta(days=110),
        fecha_ultima_visita=None,
        en_camino_por=None,
        ahora=AHORA,
    )
    assert estado == "PROXIMO"


def test_estado_vencido():
    estado = calcular_estado_seguimiento(
        fecha_formalizacion=AHORA - timedelta(days=200),
        fecha_ultima_visita=None,
        en_camino_por=None,
        ahora=AHORA,
    )
    assert estado == "VENCIDO"


def test_estado_en_camino_tiene_prioridad():
    estado = calcular_estado_seguimiento(
        fecha_formalizacion=AHORA - timedelta(days=200),
        fecha_ultima_visita=None,
        en_camino_por="unidad.especial",
        ahora=AHORA,
    )
    assert estado == "EN_CAMINO"


def test_listar_seguimiento_incluye_estado(db_session):
    comunidad = Comunidad(
        nombre="Patitas", tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="X", telefono_contacto="300", email_contacto="c@c.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    animal = Animal(
        nombre="Rocky", sexo=SexoEnum.MACHO, tamano=TamanoEnum.MEDIANO,
        barrio="X", latitud=4.6, longitud=-74.1, comunidad_id=comunidad.id,
        estado=EstadoAnimalEnum.VBP_ACTIVO, inscrito_por="maria.comunidad",
        fecha_inscripcion=datetime.now(timezone.utc) - timedelta(days=200),
    )
    db_session.add(animal)
    db_session.commit()

    token = _token(db_session, "unidad.especial", RolUsuarioEnum.UNIDAD_ESPECIAL)
    respuesta = client.get("/api/v1/animales/seguimiento", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo[0]["estado_seguimiento"] == "VENCIDO"


def test_listar_seguimiento_notifica_vencido_sin_duplicar(db_session):
    comunidad = Comunidad(
        nombre="Patitas", tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="X", telefono_contacto="300", email_contacto="c@c.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    animal = Animal(
        nombre="Rocky", sexo=SexoEnum.MACHO, tamano=TamanoEnum.MEDIANO,
        barrio="X", latitud=4.6, longitud=-74.1, comunidad_id=comunidad.id,
        estado=EstadoAnimalEnum.VBP_ACTIVO, inscrito_por="maria.comunidad",
        fecha_inscripcion=datetime.now(timezone.utc) - timedelta(days=200),
    )
    db_session.add(animal)
    db_session.commit()

    token = _token(db_session, "unidad.especial", RolUsuarioEnum.UNIDAD_ESPECIAL)

    respuesta = client.get("/api/v1/animales/seguimiento", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    assert respuesta.json()[0]["estado_seguimiento"] == "VENCIDO"

    respuesta_otra_vez = client.get("/api/v1/animales/seguimiento", headers={"Authorization": f"Bearer {token}"})
    assert respuesta_otra_vez.status_code == 200

    notificaciones = (
        db_session.query(NotificacionInterna)
        .filter_by(animal_id=animal.id, origen_tipo="VISITA_VENCIDA")
        .all()
    )
    assert len(notificaciones) == 1
