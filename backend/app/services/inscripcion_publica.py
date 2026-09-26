import re

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import EspecieEnum, SexoEnum, TamanoEnum, TipoDocumentoEnum
from app.schemas.inscripcion_publica import AnimalDeInscriptorSchema
from app.services.almacenamiento import crear_almacenamiento
from app.services.inscripcion import inscribir_animal
from app.services.inscriptores import obtener_o_crear_persona

MAXIMO_FOTO_BYTES = 10 * 1024 * 1024
_CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class InscripcionInvalida(ValueError):
    """La solicitud no cumple una regla de negocio. El mensaje se muestra a la persona."""

    def __init__(self, mensaje: str, estado: int = 422):
        super().__init__(mensaje)
        self.estado = estado


def validar_foto(foto: UploadFile) -> None:
    if not (foto.content_type or "").startswith("image/"):
        raise InscripcionInvalida("El archivo debe ser una imagen (JPG, PNG o WEBP).", 400)
    if foto.size is not None and foto.size > MAXIMO_FOTO_BYTES:
        raise InscripcionInvalida("La foto pesa mas de 10 MB. Elige una mas liviana.", 413)


def a_animal_de_inscriptor(animal: Animal) -> AnimalDeInscriptorSchema:
    return AnimalDeInscriptorSchema(
        id=animal.id,
        nombre=animal.nombre,
        especie=animal.especie,
        sexo=animal.sexo,
        tamano=animal.tamano,
        edad_estimada=animal.edad_estimada,
        descripcion=animal.descripcion,
        foto_principal=animal.foto_principal,
        estado=animal.estado,
        esterilizado=animal.esterilizado,
        tiene_microchip=bool(animal.numero_microchip),
        barrio=animal.barrio,
        fecha_inscripcion=animal.fecha_inscripcion,
    )


def inscribir_desde_publico(
    db: Session,
    settings: Settings,
    *,
    tipo_documento: TipoDocumentoEnum,
    numero_documento: str,
    nombre_persona: str,
    telefono: str,
    correo: str,
    acepta_datos: bool,
    nombre: str,
    especie: EspecieEnum,
    sexo: SexoEnum,
    tamano: TamanoEnum,
    edad_estimada: int | None,
    descripcion: str | None,
    barrio: str,
    latitud: float,
    longitud: float,
    comunidad_id: int,
    foto: UploadFile,
) -> Animal:
    if not acepta_datos:
        raise InscripcionInvalida("Debes aceptar el tratamiento de datos personales para continuar.", 400)
    if not _CORREO.match(correo.strip()):
        raise InscripcionInvalida("El correo no tiene un formato valido.")
    for valor, etiqueta in ((nombre_persona, "tu nombre"), (nombre, "el nombre del animal"), (barrio, "el barrio")):
        if not valor.strip():
            raise InscripcionInvalida(f"Escribe {etiqueta}.")
    comunidad = db.get(Comunidad, comunidad_id)
    if comunidad is None or not comunidad.activa:
        raise InscripcionInvalida("La comunidad elegida no existe o no esta activa.")
    validar_foto(foto)

    try:
        persona = obtener_o_crear_persona(
            db, tipo_documento, numero_documento, nombre_persona.strip(), telefono.strip(), correo.strip(), barrio.strip()
        )
    except ValueError as error:
        raise InscripcionInvalida(str(error)) from error

    ruta_foto = crear_almacenamiento(settings).guardar(foto)
    return inscribir_animal(
        db,
        dict(
            nombre=nombre.strip(),
            especie=especie,
            sexo=sexo,
            tamano=tamano,
            edad_estimada=edad_estimada,
            descripcion=descripcion.strip() if descripcion and descripcion.strip() else None,
            foto_principal=ruta_foto,
            barrio=barrio.strip(),
            latitud=latitud,
            longitud=longitud,
            comunidad_id=comunidad_id,
            persona_id=persona.id,
        ),
        inscrito_por="publico",
    )
