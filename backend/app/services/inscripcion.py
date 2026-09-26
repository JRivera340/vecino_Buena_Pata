from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.enums import EspecieEnum
from app.services.duplicados import buscar_posible_duplicado
from app.services.historial import registrar_evento
from app.services.localidades import localidad_de_punto


def radicado_de(animal: Animal) -> str:
    return f"VBP-{animal.fecha_inscripcion.year}-{animal.id:06d}"


def inscribir_animal(db: Session, datos: dict, inscrito_por: str) -> Animal:
    datos = dict(datos)
    if "posible_duplicado_de_id" not in datos:
        duplicado = buscar_posible_duplicado(
            db, datos.get("especie", EspecieEnum.PERRO), datos["nombre"], datos["latitud"], datos["longitud"]
        )
        datos["posible_duplicado_de_id"] = duplicado.id if duplicado else None

    if "localidad" not in datos:
        datos["localidad"] = localidad_de_punto(datos["latitud"], datos["longitud"])

    animal = Animal(**datos, inscrito_por=inscrito_por)
    db.add(animal)
    db.commit()
    db.refresh(animal)

    detalle = {"barrio": animal.barrio, "comunidad_id": animal.comunidad_id}
    if animal.persona_id is not None:
        detalle["persona_id"] = animal.persona_id
    if animal.posible_duplicado_de_id is not None:
        detalle["posible_duplicado_de_id"] = animal.posible_duplicado_de_id
    registrar_evento(db, animal_id=animal.id, tipo_evento="INSCRIPCION", usuario=inscrito_por, detalle=detalle)

    return animal
