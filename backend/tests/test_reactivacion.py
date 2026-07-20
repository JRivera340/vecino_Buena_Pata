from datetime import datetime, timezone

import pytest

from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import CausalSalidaEnum, EstadoAnimalEnum, EstadoSaludEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.evento_historial import EventoHistorial
from app.services.reactivacion import reactivar_perdido


def _crear_animal_perdido(db_session) -> Animal:
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
        nombre="Lola",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.PEQUENO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=EstadoAnimalEnum.PERDIDO,
        causal_salida=CausalSalidaEnum.PERDIDA,
        fecha_salida=datetime.now(timezone.utc),
        notas_salida="Ultima vez vista cerca del parque.",
    )
    db_session.add(animal)
    db_session.commit()
    db_session.add(CollarQr(animal_id=animal.id, codigo="vbp-def456", activo=False))
    db_session.commit()
    return animal


def test_reactivar_perdido_vuelve_a_vbp_activo_y_limpia_datos_de_salida(db_session):
    animal = _crear_animal_perdido(db_session)

    animal_reactivado = reactivar_perdido(
        db_session,
        animal_id=animal.id,
        veterinario="dr.rojas",
        estado_salud=EstadoSaludEnum.BUENO,
        estado_comportamiento="Se le ve tranquilo, buena convivencia.",
    )

    assert animal_reactivado.estado == EstadoAnimalEnum.VBP_ACTIVO
    assert animal_reactivado.causal_salida is None
    assert animal_reactivado.fecha_salida is None
    assert animal_reactivado.notas_salida is None

    collar = db_session.query(CollarQr).filter_by(animal_id=animal.id).one()
    assert collar.activo is True

    eventos = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).all()
    tipos = [e.tipo_evento for e in eventos]
    assert "REACTIVACION" in tipos
    assert "VISITA_SEGUIMIENTO" in tipos


def test_no_se_puede_reactivar_un_animal_que_no_esta_perdido(db_session):
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
        nombre="Sombra",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.MEDIANO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
        estado=EstadoAnimalEnum.CANDIDATO,
    )
    db_session.add(animal)
    db_session.commit()

    with pytest.raises(ValueError):
        reactivar_perdido(
            db_session,
            animal_id=animal.id,
            veterinario="dr.rojas",
            estado_salud=EstadoSaludEnum.BUENO,
            estado_comportamiento="Tranquilo",
        )
