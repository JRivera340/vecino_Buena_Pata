from app.models.animal import Animal
from app.schemas.inscripcion_publica import AnimalDeInscriptorSchema


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
        localidad=animal.localidad,
        fecha_inscripcion=animal.fecha_inscripcion,
    )
