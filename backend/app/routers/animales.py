from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, requiere_rol
from app.models.animal import Animal
from app.models.enums import EstadoAnimalEnum, RolUsuarioEnum
from app.models.evento_historial import EventoHistorial
from app.models.notificacion_interna import NotificacionInterna
from app.models.usuario import Usuario
from app.models.validacion import Validacion
from app.models.visita_seguimiento import VisitaSeguimiento
from app.schemas.animal import AnimalCrear, AnimalSchema
from app.schemas.historial import EventoHistorialSchema
from app.schemas.seguimiento import AnimalSeguimientoSchema
from app.schemas.validacion import ValidacionSchema
from app.schemas.visita import VisitaSchema
from app.services.documentos import normalizar_numero_documento
from app.services.inscripcion import inscribir_animal as inscribir_animal_servicio
from app.services.inscriptores import obtener_o_crear_persona
from app.services.localidades import localidad_de_punto
from app.services.notificaciones import procesar_notificaciones, registrar_notificaciones
from app.services.notificaciones_internas import crear_notificaciones
from app.services.seguimiento_estado import DIAS_CADENCIA, calcular_estado_seguimiento

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


@router.get("/seguimiento", response_model=list[AnimalSeguimientoSchema])
def listar_seguimiento(
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuarioEnum.UNIDAD_ESPECIAL, RolUsuarioEnum.ADMIN)),
) -> list[dict]:
    ahora = datetime.now(timezone.utc)
    animales = db.query(Animal).filter_by(estado=EstadoAnimalEnum.VBP_ACTIVO).all()
    resultado = []
    for animal in animales:
        ultima_visita = (
            db.query(VisitaSeguimiento)
            .filter_by(animal_id=animal.id)
            .order_by(VisitaSeguimiento.fecha.desc())
            .first()
        )
        if ultima_visita is not None:
            base = ultima_visita.fecha
        else:
            evento_formalizacion = (
                db.query(EventoHistorial)
                .filter_by(animal_id=animal.id, tipo_evento="FORMALIZACION")
                .order_by(EventoHistorial.fecha.desc())
                .first()
            )
            base = evento_formalizacion.fecha if evento_formalizacion else animal.fecha_inscripcion
        estado = calcular_estado_seguimiento(
            fecha_formalizacion=base,
            fecha_ultima_visita=None,
            en_camino_por=animal.visita_en_camino_por,
            ahora=ahora,
        )
        if estado == "VENCIDO":
            ya_notificado = (
                db.query(NotificacionInterna)
                .filter_by(animal_id=animal.id, origen_tipo="VISITA_VENCIDA")
                .filter(NotificacionInterna.creada_en >= ahora - timedelta(days=DIAS_CADENCIA))
                .first()
            )
            if ya_notificado is None:
                crear_notificaciones(db, animal=animal, origen_tipo="VISITA_VENCIDA", origen_id=None)
        resultado.append(
            {
                "id": animal.id,
                "nombre": animal.nombre,
                "barrio": animal.barrio,
                "comunidad_id": animal.comunidad_id,
                "latitud": animal.latitud,
                "longitud": animal.longitud,
                "estado_seguimiento": estado,
                "visita_en_camino_por": animal.visita_en_camino_por,
                "proxima_visita_vence": base + timedelta(days=DIAS_CADENCIA),
            }
        )
    return resultado


@router.get("/mis-perritos", response_model=list[AnimalSchema])
def mis_perritos(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolUsuarioEnum.COMUNIDAD, RolUsuarioEnum.LIDER, RolUsuarioEnum.ADMIN)),
) -> list[Animal]:
    if usuario.comunidad_id is None:
        return []
    return (
        db.query(Animal)
        .filter_by(comunidad_id=usuario.comunidad_id)
        .order_by(Animal.fecha_inscripcion.desc())
        .all()
    )


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
    try:
        normalizar_numero_documento(datos.numero_documento)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    persona = obtener_o_crear_persona(
        db, datos.tipo_documento, datos.numero_documento,
        nombre=usuario.nombre, telefono="", correo="", barrio=datos.barrio,
    )
    animal = inscribir_animal_servicio(
        db,
        datos={**datos.model_dump(exclude={"tipo_documento", "numero_documento"}), "persona_id": persona.id},
        inscrito_por=usuario.username,
    )
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
