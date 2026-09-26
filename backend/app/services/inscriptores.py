from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.enums import TipoDocumentoEnum
from app.models.persona import Persona
from app.services.documentos import normalizar_numero_documento


def buscar_persona(db: Session, tipo: TipoDocumentoEnum, numero: str) -> Persona | None:
    return (
        db.query(Persona)
        .filter_by(tipo_documento=tipo, numero_documento=normalizar_numero_documento(numero))
        .first()
    )


def obtener_o_crear_persona(
    db: Session,
    tipo: TipoDocumentoEnum,
    numero: str,
    nombre: str,
    telefono: str,
    correo: str,
    barrio: str,
) -> Persona:
    """Devuelve la persona de ese documento. Si ya existe no se tocan sus datos: sin cuenta
    ni verificacion, quien escriba un documento ajeno no debe poder cambiar su contacto."""
    persona = buscar_persona(db, tipo, numero)
    if persona is not None:
        return persona
    persona = Persona(
        tipo_documento=tipo,
        numero_documento=normalizar_numero_documento(numero),
        nombre=nombre,
        telefono=telefono,
        correo=correo,
        barrio=barrio,
        aceptacion_datos_en=datetime.now(timezone.utc),
    )
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


def animales_de_persona(db: Session, tipo: TipoDocumentoEnum, numero: str) -> list[Animal]:
    persona = buscar_persona(db, tipo, numero)
    if persona is None:
        return []
    return (
        db.query(Animal)
        .filter_by(persona_id=persona.id)
        .order_by(Animal.fecha_inscripcion.desc(), Animal.id.desc())
        .all()
    )
