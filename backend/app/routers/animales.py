from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, requiere_rol
from app.models.animal import Animal
from app.models.enums import RolUsuarioEnum
from app.models.evento_historial import EventoHistorial
from app.models.usuario import Usuario
from app.models.validacion import Validacion
from app.models.visita_seguimiento import VisitaSeguimiento
from app.schemas.animal import AnimalCrear, AnimalSchema
from app.schemas.historial import EventoHistorialSchema
from app.schemas.validacion import ValidacionSchema
from app.schemas.visita import VisitaSchema
from app.services.inscripcion import inscribir_animal as inscribir_animal_servicio
from app.services.localidades import localidad_de_punto
from app.services.notificaciones import procesar_notificaciones, registrar_notificaciones

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
    tareas: BackgroundTasks,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROLES_INSCRIBEN)),
) -> Animal:
    if localidad_de_punto(datos.latitud, datos.longitud) is None:
        raise HTTPException(
            status_code=422,
            detail="El punto marcado esta fuera de Bogota. Marca un lugar dentro de la ciudad.",
        )
    animal = inscribir_animal_servicio(db, datos=datos.model_dump(), inscrito_por=usuario.username)
    try:
        ids = registrar_notificaciones(db, animal, None)
    except Exception:  # noqa: BLE001 - anotar el correo no debe tumbar la inscripcion
        db.rollback()
        ids = []
    if ids:
        tareas.add_task(procesar_notificaciones, ids)
    return animal


@router.get("/{animal_id}/historial", response_model=list[EventoHistorialSchema])
def listar_historial(
    animal_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)
) -> list[EventoHistorial]:
    return db.query(EventoHistorial).filter_by(animal_id=animal_id).order_by(EventoHistorial.fecha).all()


@router.get("/{animal_id}/visitas", response_model=list[VisitaSchema])
def listar_visitas(
    animal_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)
) -> list[VisitaSeguimiento]:
    return (
        db.query(VisitaSeguimiento)
        .filter_by(animal_id=animal_id)
        .order_by(VisitaSeguimiento.fecha.desc())
        .all()
    )


@router.get("/{animal_id}/validaciones", response_model=list[ValidacionSchema])
def listar_validaciones(
    animal_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)
) -> list[Validacion]:
    return db.query(Validacion).filter_by(animal_id=animal_id).order_by(Validacion.fecha.desc()).all()
