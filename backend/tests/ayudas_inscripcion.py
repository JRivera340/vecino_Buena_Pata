from app.models.comunidad import Comunidad
from app.models.enums import EspecieEnum, SexoEnum, TamanoEnum, TipoComunidadEnum, TipoDocumentoEnum
from app.models.animal import Animal
from app.services.inscripcion import inscribir_animal
from app.services.inscriptores import obtener_o_crear_persona


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


def inscribir_animal_de_prueba(db, comunidad_id: int, **cambios) -> Animal:
    """Crea una persona (si hace falta) y un animal inscrito por ella, sin pasar por HTTP.
    Util para preparar datos de pruebas que verifican la consulta por documento."""
    persona = obtener_o_crear_persona(
        db, TipoDocumentoEnum.CC, "1234567", "Ana Perez", "3001234567", "ana@example.org", "Las Cruces"
    )
    datos = datos_animal(comunidad_id, persona_id=persona.id, **cambios)
    return inscribir_animal(db, datos, inscrito_por="publico")
