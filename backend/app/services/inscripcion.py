from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.services.historial import registrar_evento


def inscribir_animal(db: Session, datos: dict, inscrito_por: str) -> Animal:
    animal = Animal(**datos, inscrito_por=inscrito_por)
    db.add(animal)
    db.commit()
    db.refresh(animal)

    registrar_evento(
        db,
        animal_id=animal.id,
        tipo_evento="INSCRIPCION",
        usuario=inscrito_por,
        detalle={"barrio": animal.barrio, "comunidad_id": animal.comunidad_id},
    )

    return animal
