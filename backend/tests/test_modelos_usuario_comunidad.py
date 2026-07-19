from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, TipoComunidadEnum
from app.models.usuario import Usuario


def test_crear_y_leer_usuario(db_session):
    usuario = Usuario(
        nombre="Maria Comunidad",
        rol=RolUsuarioEnum.COMUNIDAD,
        username="maria.comunidad",
        password_hash="hash-falso",
    )
    db_session.add(usuario)
    db_session.commit()

    guardado = db_session.query(Usuario).filter_by(username="maria.comunidad").one()
    assert guardado.nombre == "Maria Comunidad"
    assert guardado.rol == RolUsuarioEnum.COMUNIDAD


def test_crear_y_leer_comunidad(db_session):
    comunidad = Comunidad(
        nombre="Junta de Accion Comunal La Esperanza",
        tipo=TipoComunidadEnum.ACCION_COMUNAL,
        barrio="La Esperanza",
        telefono_contacto="3001234567",
        email_contacto="contacto@laesperanza.org",
    )
    db_session.add(comunidad)
    db_session.commit()

    guardada = db_session.query(Comunidad).filter_by(barrio="La Esperanza").one()
    assert guardada.tipo == TipoComunidadEnum.ACCION_COMUNAL
    assert guardada.activa is True
