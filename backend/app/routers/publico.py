from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.core.limite import limitar
from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import EspecieEnum, EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoDocumentoEnum
from app.models.reporte_novedad import ReporteNovedad
from app.schemas.inscripcion_publica import (
    ComunidadPublicaSchema,
    InscripcionPublicaRespuesta,
    VerificarInscriptorRespuesta,
    VerificarInscriptorSolicitud,
)
from app.schemas.publico import (
    AnimalMapaPublicoSchema,
    AnimalPublicoSchema,
    HojaVidaPublicaSchema,
    ReporteNovedadCrear,
    ReporteNovedadRespuesta,
)
from app.services.inscripcion import radicado_de
from app.services.inscripcion_publica import InscripcionInvalida, a_animal_de_inscriptor, inscribir_desde_publico
from app.services.inscriptores import animales_de_persona
from app.services.documentos import normalizar_numero_documento
from app.services.mapa_publico import listar_mapa_publico, obtener_hoja_vida_publica

router = APIRouter(prefix="/publico", tags=["publico"])


@router.get("/mapa", response_model=list[AnimalMapaPublicoSchema])
def obtener_mapa_publico(respuesta: Response, db: Session = Depends(get_db)) -> list[dict]:
    respuesta.headers["Cache-Control"] = "public, max-age=60"
    return listar_mapa_publico(db)


@router.get("/animales/{animal_id}/hoja-vida", response_model=HojaVidaPublicaSchema)
def obtener_hoja_vida(animal_id: int, db: Session = Depends(get_db)) -> dict:
    hoja = obtener_hoja_vida_publica(db, animal_id)
    if hoja is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal no disponible.")
    return hoja


def _buscar_animal_por_codigo(db: Session, codigo: str) -> Animal:
    collar = db.query(CollarQr).filter_by(codigo=codigo, activo=True).first()
    if collar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Codigo no encontrado.")
    animal = db.get(Animal, collar.animal_id)
    if animal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal no encontrado.")
    return animal


@router.get("/animales/{codigo}", response_model=AnimalPublicoSchema)
def obtener_animal_publico(codigo: str, db: Session = Depends(get_db)) -> Animal:
    return _buscar_animal_por_codigo(db, codigo)


@router.post("/animales/{codigo}/reportes", response_model=ReporteNovedadRespuesta, status_code=201)
def crear_reporte_publico(
    codigo: str, datos: ReporteNovedadCrear, db: Session = Depends(get_db)
) -> ReporteNovedad:
    animal = _buscar_animal_por_codigo(db, codigo)
    reporte = ReporteNovedad(
        animal_id=animal.id,
        reportante_nombre=datos.reportante_nombre,
        descripcion=datos.descripcion,
        foto=datos.foto,
        latitud=datos.latitud,
        longitud=datos.longitud,
    )
    db.add(reporte)
    db.commit()
    db.refresh(reporte)
    return reporte


@router.get("/comunidades", response_model=list[ComunidadPublicaSchema])
def listar_comunidades_publicas(db: Session = Depends(get_db)) -> list[Comunidad]:
    return db.query(Comunidad).filter(Comunidad.activa.is_(True)).order_by(Comunidad.nombre).all()


@router.post(
    "/inscriptores/verificar",
    response_model=VerificarInscriptorRespuesta,
    dependencies=[Depends(limitar("verificar", lambda: get_settings().limite_verificar_por_minuto, 60))],
)
def verificar_inscriptor(datos: VerificarInscriptorSolicitud, db: Session = Depends(get_db)) -> dict:
    try:
        normalizar_numero_documento(datos.numero_documento)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    animales = animales_de_persona(db, datos.tipo_documento, datos.numero_documento)
    return {"total": len(animales), "animales": [a_animal_de_inscriptor(animal) for animal in animales]}


@router.post(
    "/inscripciones",
    response_model=InscripcionPublicaRespuesta,
    status_code=201,
    dependencies=[Depends(limitar("inscripcion", lambda: get_settings().limite_inscripciones_por_hora, 3600))],
)
def inscribir_desde_el_publico(
    tipo_documento: TipoDocumentoEnum = Form(...),
    numero_documento: str = Form(...),
    nombre_persona: str = Form(..., max_length=160),
    telefono: str = Form(..., max_length=30),
    correo: str = Form(..., max_length=160),
    acepta_datos: bool = Form(...),
    nombre: str = Form(..., max_length=120),
    especie: EspecieEnum = Form(EspecieEnum.PERRO),
    sexo: SexoEnum = Form(...),
    tamano: TamanoEnum = Form(...),
    edad_estimada: int | None = Form(None, ge=0, le=30),
    descripcion: str | None = Form(None, max_length=1000),
    barrio: str = Form(..., max_length=120),
    latitud: float = Form(..., ge=-90, le=90),
    longitud: float = Form(..., ge=-180, le=180),
    comunidad_id: int = Form(...),
    foto: UploadFile = File(...),
    sitio_web: str = Form(""),
    db: Session = Depends(get_db),
) -> InscripcionPublicaRespuesta:
    if sitio_web.strip():
        # Campo trampa que una persona no ve: si viene lleno es un bot. Se responde como si
        # hubiera funcionado, sin guardar nada.
        return InscripcionPublicaRespuesta(
            animal_id=0, radicado="VBP-0000-000000", nombre=nombre, estado=EstadoAnimalEnum.CANDIDATO
        )
    try:
        animal = inscribir_desde_publico(
            db,
            get_settings(),
            tipo_documento=tipo_documento,
            numero_documento=numero_documento,
            nombre_persona=nombre_persona,
            telefono=telefono,
            correo=correo,
            acepta_datos=acepta_datos,
            nombre=nombre,
            especie=especie,
            sexo=sexo,
            tamano=tamano,
            edad_estimada=edad_estimada,
            descripcion=descripcion,
            barrio=barrio,
            latitud=latitud,
            longitud=longitud,
            comunidad_id=comunidad_id,
            foto=foto,
        )
    except InscripcionInvalida as error:
        raise HTTPException(status_code=error.estado, detail=str(error)) from error
    return InscripcionPublicaRespuesta(
        animal_id=animal.id, radicado=radicado_de(animal), nombre=animal.nombre, estado=animal.estado
    )
