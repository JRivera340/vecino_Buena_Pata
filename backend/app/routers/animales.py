from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, requiere_rol
from app.models.animal import Animal
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario
from app.schemas.animal import AnimalCrear, AnimalSchema

router = APIRouter(prefix="/animales", tags=["animales"])

_ROLES_INSCRIBEN = (
    RolUsuarioEnum.COMUNIDAD,
    RolUsuarioEnum.VETERINARIO,
    RolUsuarioEnum.LIDER,
    RolUsuarioEnum.ADMIN,
)


@router.get("", response_model=list[AnimalSchema])
def listar_animales(db: Session = Depends(get_db), _=Depends(get_current_user)) -> list[Animal]:
    return db.query(Animal).order_by(Animal.fecha_inscripcion.desc()).all()


@router.get("/{animal_id}", response_model=AnimalSchema)
def obtener_animal(animal_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)) -> Animal:
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal no encontrado")
    return animal


@router.post("", response_model=AnimalSchema, status_code=201)
def inscribir_animal(
    datos: AnimalCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROLES_INSCRIBEN)),
) -> Animal:
    animal = Animal(**datos.model_dump(), inscrito_por=usuario.username)
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal
