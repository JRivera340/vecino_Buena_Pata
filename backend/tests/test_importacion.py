from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, TipoComunidadEnum
from app.models.notificacion_interna import NotificacionInterna
from app.models.usuario import Usuario

client = TestClient(app)


def _token_admin(db_session) -> str:
    usuario = Usuario(
        nombre="Admin", rol=RolUsuarioEnum.ADMIN, username="admin.vbp", password_hash=hash_password("vbp2026"),
    )
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject="admin.vbp", rol=RolUsuarioEnum.ADMIN.value)


def _crear_comunidad(db_session) -> Comunidad:
    comunidad = Comunidad(
        nombre="Patitas del Sur", tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="El Poblado", telefono_contacto="3009876543", email_contacto="c@c.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    return comunidad


def test_importar_csv_con_filas_validas_incompletas_y_con_error(db_session):
    token = _token_admin(db_session)
    comunidad = _crear_comunidad(db_session)

    csv_contenido = (
        "nombre,sexo,tamano,barrio,latitud,longitud,comunidad,tipo_documento,numero_documento,estado,causal_salida\n"
        f"Firulais,MACHO,MEDIANO,El Poblado,4.65,-74.1,{comunidad.nombre},CC,1020304050,VBP_ACTIVO,\n"
        "Luna,HEMBRA,PEQUENO,La Candelaria,4.6,-74.08,,,,ADOPTADO,ADOPCION\n"
        "SinDatos,MACHO,,El Poblado,4.65,-74.1,,,,,\n"
    )

    respuesta = client.post(
        "/api/v1/importacion/animales",
        files={"archivo": ("historico.csv", csv_contenido.encode("utf-8"), "text/csv")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 200
    resumen = respuesta.json()
    assert resumen["total"] == 3
    assert resumen["importados"] == 2
    assert resumen["con_error"] == 1
    assert resumen["incompletos"] == 1  # Luna, sin comunidad ni documento

    filas = {f["fila"]: f for f in resumen["filas"]}
    assert filas[2]["estado"] == "OK"
    assert filas[2]["incompleto"] is False
    assert filas[3]["estado"] == "OK"
    assert filas[3]["incompleto"] is True
    assert filas[4]["estado"] == "ERROR"

    notificaciones = db_session.query(NotificacionInterna).filter_by(origen_tipo="IMPORTACION_INCOMPLETA").all()
    assert len(notificaciones) == 1
    assert notificaciones[0].animal_id == filas[3]["animal_id"]


def test_solo_admin_puede_importar(db_session):
    usuario = Usuario(
        nombre="Lider", rol=RolUsuarioEnum.LIDER, username="lider.campo", password_hash=hash_password("vbp2026"),
    )
    db_session.add(usuario)
    db_session.commit()
    token = create_access_token(subject="lider.campo", rol=RolUsuarioEnum.LIDER.value)

    respuesta = client.post(
        "/api/v1/importacion/animales",
        files={"archivo": ("historico.csv", b"nombre,sexo\n", "text/csv")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 403


def test_rechaza_archivo_que_no_es_csv(db_session):
    token = _token_admin(db_session)

    respuesta = client.post(
        "/api/v1/importacion/animales",
        files={"archivo": ("historico.xlsx", b"no importa", "application/octet-stream")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 422
