import pytest

from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoComunidadEnum, VeredictoValidacionEnum
from app.models.evento_historial import EventoHistorial
from app.models.validacion import Validacion
from app.services.formalizacion import formalizar_vbp, generar_codigo_qr


def _crear_animal(db_session, **kwargs) -> Animal:
    comunidad = Comunidad(
        nombre="Patitas del Sur",
        tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="El Poblado",
        telefono_contacto="3009876543",
        email_contacto="contacto@patitasdelsur.org",
    )
    db_session.add(comunidad)
    db_session.commit()
    valores = dict(
        nombre="Canela",
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.PEQUENO,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
    )
    valores.update(kwargs)
    animal = Animal(**valores)
    db_session.add(animal)
    db_session.commit()
    return animal


def test_generar_codigo_qr_es_unico(db_session):
    _crear_animal(db_session)
    codigo_a = generar_codigo_qr(db_session)
    codigo_b = generar_codigo_qr(db_session)
    assert codigo_a != codigo_b
    assert codigo_a.startswith("vbp-")


def test_formalizar_vbp_exitoso_genera_collar_y_cambia_estado(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.EN_PROCESO, esterilizado=True, numero_microchip="985141900003")
    db_session.add(
        Validacion(
            animal_id=animal.id,
            veterinario="dr.rojas",
            veredicto=VeredictoValidacionEnum.APROBADO,
            pendientes=[],
            observaciones="Cumple todo.",
        )
    )
    db_session.commit()

    animal_formalizado, collar = formalizar_vbp(db_session, animal_id=animal.id, lider="lider.campo")

    assert animal_formalizado.estado == EstadoAnimalEnum.VBP_ACTIVO
    assert collar.animal_id == animal.id
    assert collar.activo is True
    assert collar.codigo.startswith("vbp-")

    eventos = db_session.query(EventoHistorial).filter_by(animal_id=animal.id).all()
    assert any(e.tipo_evento == "FORMALIZACION" for e in eventos)


def test_formalizar_vbp_falla_sin_validacion(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.CANDIDATO)

    with pytest.raises(ValueError):
        formalizar_vbp(db_session, animal_id=animal.id, lider="lider.campo")


def test_formalizar_vbp_falla_si_no_cumple_criterios(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.EN_PROCESO, esterilizado=False)
    db_session.add(
        Validacion(
            animal_id=animal.id,
            veterinario="dr.rojas",
            veredicto=VeredictoValidacionEnum.APROBADO,
            pendientes=[],
            observaciones="",
        )
    )
    db_session.commit()

    with pytest.raises(ValueError, match="esterilizacion"):
        formalizar_vbp(db_session, animal_id=animal.id, lider="lider.campo")


def test_formalizar_vbp_falla_en_estado_no_formalizable(db_session):
    animal = _crear_animal(db_session, estado=EstadoAnimalEnum.VBP_ACTIVO)

    with pytest.raises(ValueError):
        formalizar_vbp(db_session, animal_id=animal.id, lider="lider.campo")
