from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.reporte_novedad import ReporteNovedad
from app.models.usuario import Usuario

client = TestClient(app)


def _token(db_session, username: str, rol: RolUsuarioEnum) -> str:
    usuario = Usuario(nombre=username, rol=rol, username=username, password_hash=hash_password("vbp2026"))
    db_session.add(usuario)
    db_session.commit()
    return create_access_token(subject=username, rol=rol.value)


def _crear_reporte(db_session) -> int:
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
    reporte = ReporteNovedad(
        animal_id=animal.id,
        reportante_nombre="Vecino anonimo",
        descripcion="No esta comiendo.",
    )
    db_session.add(reporte)
    db_session.commit()
    return reporte.id


def test_listar_reportes(db_session):
    token = _token(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    _crear_reporte(db_session)

    respuesta = client.get("/api/v1/reportes", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    assert len(respuesta.json()) == 1
    assert respuesta.json()[0]["estado"] == "NUEVO"


def test_veterinario_registra_atencion_y_cierra_reporte(db_session):
    token = _token(db_session, "dr.rojas", RolUsuarioEnum.VETERINARIO)
    reporte_id = _crear_reporte(db_session)

    respuesta = client.post(
        f"/api/v1/reportes/{reporte_id}/atencion",
        json={"acciones_realizadas": "Se llevo alimento.", "resultado": "El animal volvio a comer."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201

    respuesta_lista = client.get("/api/v1/reportes", headers={"Authorization": f"Bearer {token}"})
    assert respuesta_lista.json()[0]["estado"] == "CERRADO"


def test_atender_reporte_ya_cerrado_devuelve_409(db_session):
    token = _token(db_session, "dr.rojas", RolUsuarioEnum.VETERINARIO)
    reporte_id = _crear_reporte(db_session)
    client.post(
        f"/api/v1/reportes/{reporte_id}/atencion",
        json={"acciones_realizadas": "Primera visita.", "resultado": "Resuelto."},
        headers={"Authorization": f"Bearer {token}"},
    )

    respuesta = client.post(
        f"/api/v1/reportes/{reporte_id}/atencion",
        json={"acciones_realizadas": "Segunda visita.", "resultado": "N/A"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 409


def test_atencion_queda_registrada_en_historial_del_animal(db_session):
    token_vet = _token(db_session, "dr.rojas", RolUsuarioEnum.VETERINARIO)

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
    reporte = ReporteNovedad(
        animal_id=animal.id,
        reportante_nombre="Vecino anonimo",
        descripcion="Se ve decaido.",
    )
    db_session.add(reporte)
    db_session.commit()

    respuesta = client.post(
        f"/api/v1/reportes/{reporte.id}/atencion",
        json={"acciones_realizadas": "Visita de verificacion.", "resultado": "Todo en orden."},
        headers={"Authorization": f"Bearer {token_vet}"},
    )
    assert respuesta.status_code == 201

    respuesta_historial = client.get(
        f"/api/v1/animales/{animal.id}/historial", headers={"Authorization": f"Bearer {token_vet}"}
    )
    assert respuesta_historial.status_code == 200
    tipos = [evento["tipo_evento"] for evento in respuesta_historial.json()]
    assert "ATENCION_ESPECIAL" in tipos


def test_comunidad_no_puede_registrar_atencion(db_session):
    token = _token(db_session, "maria.comunidad", RolUsuarioEnum.COMUNIDAD)
    reporte_id = _crear_reporte(db_session)

    respuesta = client.post(
        f"/api/v1/reportes/{reporte_id}/atencion",
        json={"acciones_realizadas": "Visita.", "resultado": "N/A"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 403


def test_solo_veterinario_y_admin_atienden_reportes(db_session):
    reporte_id = _crear_reporte(db_session)
    for rol in (RolUsuarioEnum.COMUNIDAD, RolUsuarioEnum.LIDER):
        token = _token(db_session, f"usuario.{rol.value.lower()}", rol)
        respuesta = client.post(
            f"/api/v1/reportes/{reporte_id}/atencion",
            json={"acciones_realizadas": "Intento.", "resultado": "N/A"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert respuesta.status_code == 403

    token_admin = _token(db_session, "admin", RolUsuarioEnum.ADMIN)
    respuesta = client.post(
        f"/api/v1/reportes/{reporte_id}/atencion",
        json={"acciones_realizadas": "Visita.", "resultado": "Resuelto."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert respuesta.status_code == 201
