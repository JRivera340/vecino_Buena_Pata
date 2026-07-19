from sqlalchemy.orm import Session

from app.models.evento_historial import EventoHistorial


def registrar_evento(db: Session, animal_id: int, tipo_evento: str, usuario: str, detalle: dict) -> EventoHistorial:
    evento = EventoHistorial(
        animal_id=animal_id,
        tipo_evento=tipo_evento,
        usuario=usuario,
        detalle=detalle,
    )
    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento
