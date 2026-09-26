from app.models.animal import Animal
from app.models.atencion_especial import AtencionEspecial
from app.models.comunidad import Comunidad
from app.models.enums import EstadoReporteEnum, SexoEnum, TamanoEnum, TipoComunidadEnum
from app.models.reporte_novedad import ReporteNovedad


def _crear_animal(db_session):
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
        nombre="Motas",
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.GRANDE,
        barrio="El Poblado",
        latitud=4.65,
        longitud=-74.1,
        comunidad_id=comunidad.id,
        inscrito_por="maria.comunidad",
    )
    db_session.add(animal)
    db_session.commit()
    return animal, comunidad


def test_crear_reporte_y_atencion(db_session):
    animal, comunidad = _crear_animal(db_session)
    reporte = ReporteNovedad(
        animal_id=animal.id,
        reportante_nombre="Vecino anonimo",
        comunidad_id=comunidad.id,
        descripcion="No esta comiendo hace dos dias",
    )
    db_session.add(reporte)
    db_session.commit()

    assert reporte.estado == EstadoReporteEnum.NUEVO

    atencion = AtencionEspecial(
        reporte_id=reporte.id,
        responsable="dr.rojas",
        acciones_realizadas="Se llevo alimento y se reviso al animal",
        resultado="El animal volvio a comer con normalidad",
    )
    db_session.add(atencion)
    db_session.commit()

    guardada = db_session.query(AtencionEspecial).filter_by(reporte_id=reporte.id).one()
    assert guardada.responsable == "dr.rojas"
