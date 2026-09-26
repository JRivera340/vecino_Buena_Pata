from app.models.comunidad import Comunidad
from app.models.enums import EspecieEnum, SexoEnum, TamanoEnum, TipoComunidadEnum


def crear_comunidad(db, nombre="Vecinos de Santa Fe") -> Comunidad:
    comunidad = Comunidad(
        nombre=nombre,
        tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="Las Cruces",
        telefono_contacto="3000000000",
        email_contacto="contacto@example.org",
    )
    db.add(comunidad)
    db.commit()
    db.refresh(comunidad)
    return comunidad


def datos_animal(comunidad_id: int = 1, **cambios) -> dict:
    """Datos minimos para inscribir. Crear antes la comunidad con crear_comunidad."""
    datos = dict(
        nombre="Copito",
        especie=EspecieEnum.PERRO,
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.PEQUENO,
        barrio="Las Cruces",
        latitud=4.6000,
        longitud=-74.0800,
        comunidad_id=comunidad_id,
    )
    datos.update(cambios)
    return datos
