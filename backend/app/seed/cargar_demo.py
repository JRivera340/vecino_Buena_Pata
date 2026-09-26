"""Carga cuatro animales de demostracion, uno por cada etapa del flujo.

Uso: python -m app.seed.cargar_demo

Es seguro repetirlo: si ya existen los cuatro animales de demostracion no
cambia nada. Con --rehacer los borra y los vuelve a crear. Tambien retira los
datos de prueba de la carga inicial (inscritos como "carga_xlsx").
"""

import io
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models.animal import Animal
from app.models.atencion_especial import AtencionEspecial
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import (
    CausalSalidaEnum,
    EspecieEnum,
    EstadoAnimalEnum,
    EstadoSaludEnum,
    SexoEnum,
    TamanoEnum,
    TipoComunidadEnum,
    VeredictoValidacionEnum,
)
from app.models.evento_historial import EventoHistorial
from app.models.reporte_novedad import ReporteNovedad
from app.models.validacion import Validacion
from app.models.visita_seguimiento import VisitaSeguimiento
from app.services.almacenamiento import crear_almacenamiento
from app.services.formalizacion import formalizar_vbp
from app.services.inscripcion import inscribir_animal
from app.services.salida import registrar_salida
from app.services.seguimiento import registrar_visita
from app.services.validacion import registrar_validacion

DIRECTORIO_IMAGENES = Path(__file__).parent / "imagenes"

INSCRITO_DEMO = "demo"
INSCRITOS_A_RETIRAR = (INSCRITO_DEMO, "carga_xlsx")
COMUNIDAD_DEMO = "Vecinos de Santa Fe"
COMUNIDAD_PRUEBA_ANTERIOR = "Comunidad de prueba"

INSCRIPTOR = "maria.comunidad"
VETERINARIO = "dr.rojas"
LIDER = "lider.campo"


def _retirar_animales(db: Session) -> None:
    ids = [
        fila[0]
        for fila in db.query(Animal.id).filter(Animal.inscrito_por.in_(INSCRITOS_A_RETIRAR)).all()
    ]
    if ids:
        reportes = [fila[0] for fila in db.query(ReporteNovedad.id).filter(ReporteNovedad.animal_id.in_(ids))]
        if reportes:
            db.execute(delete(AtencionEspecial).where(AtencionEspecial.reporte_id.in_(reportes)))
        db.execute(delete(ReporteNovedad).where(ReporteNovedad.animal_id.in_(ids)))
        db.execute(delete(VisitaSeguimiento).where(VisitaSeguimiento.animal_id.in_(ids)))
        db.execute(delete(Validacion).where(Validacion.animal_id.in_(ids)))
        db.execute(delete(CollarQr).where(CollarQr.animal_id.in_(ids)))
        db.execute(delete(EventoHistorial).where(EventoHistorial.animal_id.in_(ids)))
        db.execute(delete(Animal).where(Animal.id.in_(ids)))

    anterior = db.query(Comunidad).filter_by(nombre=COMUNIDAD_PRUEBA_ANTERIOR).first()
    if anterior is not None:
        en_uso = db.query(Animal.id).filter_by(comunidad_id=anterior.id).first()
        reportada = db.query(ReporteNovedad.id).filter_by(comunidad_id=anterior.id).first()
        if en_uso is None and reportada is None:
            db.delete(anterior)
    db.commit()


def _comunidad_demo(db: Session) -> Comunidad:
    comunidad = db.query(Comunidad).filter_by(nombre=COMUNIDAD_DEMO).first()
    if comunidad is None:
        comunidad = Comunidad(
            nombre=COMUNIDAD_DEMO,
            tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
            barrio="Las Cruces",
            telefono_contacto="3000000000",
            email_contacto="contacto@vecinosdesantafe.org",
        )
        db.add(comunidad)
        db.commit()
        db.refresh(comunidad)
    return comunidad


def _subir_foto(almacenamiento, archivo: str) -> str:
    contenido = (DIRECTORIO_IMAGENES / archivo).read_bytes()
    return almacenamiento.guardar(UploadFile(filename=archivo, file=io.BytesIO(contenido)))


def _hace(dias: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=dias)


def cargar_demo(db: Session, almacenamiento, rehacer: bool = False) -> bool:
    existentes = db.query(Animal).filter_by(inscrito_por=INSCRITO_DEMO).count()
    if existentes == 4 and not rehacer:
        return False

    _retirar_animales(db)
    comunidad = _comunidad_demo(db)

    def inscribir(**datos) -> Animal:
        foto = _subir_foto(almacenamiento, datos.pop("foto"))
        return inscribir_animal(db, dict(**datos, foto_principal=foto, comunidad_id=comunidad.id), INSCRITO_DEMO)

    # Vecino Buena Pata activo, con collar y una visita de seguimiento.
    copito = inscribir(
        nombre="Copito",
        especie=EspecieEnum.PERRO,
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.PEQUENO,
        edad_estimada=4,
        descripcion="Terrier blanco de pelo largo, juguetón y muy sociable. Acompaña a los vecinos en el parque.",
        barrio="La Macarena",
        latitud=4.6125,
        longitud=-74.0655,
        foto="perro-westie.jpg",
    )
    registrar_validacion(
        db, copito.id, VETERINARIO, VeredictoValidacionEnum.APROBADO, [], "Cumple los criterios del programa.",
        esterilizado=True, numero_microchip="985141000101",
    )
    formalizar_vbp(db, copito.id, LIDER)
    registrar_visita(
        db, copito.id, VETERINARIO, EstadoSaludEnum.BUENO, "Tranquilo y sociable",
        peso_kg=8.4, observaciones="Buen pelaje y buen apetito.",
    )

    # En proceso: la validacion quedo con un pendiente.
    cleo = inscribir(
        nombre="Cleo",
        especie=EspecieEnum.GATO,
        sexo=SexoEnum.HEMBRA,
        tamano=TamanoEnum.MEDIANO,
        edad_estimada=3,
        descripcion="Gata siamesa de ojos azules. Observa todo desde el balcón de la cuadra.",
        barrio="La Perseverancia",
        latitud=4.6103,
        longitud=-74.0656,
        foto="gato-siames.jpg",
    )
    registrar_validacion(
        db, cleo.id, VETERINARIO, VeredictoValidacionEnum.CON_PENDIENTES, ["SIN_CHIP"],
        "Falta ponerle el microchip.", esterilizado=True,
    )

    # Candidato: recien inscrito, sin validar.
    inscribir(
        nombre="Bruno",
        especie=EspecieEnum.PERRO,
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.PEQUENO,
        edad_estimada=0,
        descripcion="Cachorro de bulldog de pelaje claro. Lo encontraron los vecinos de la calle sexta.",
        barrio="Las Nieves",
        latitud=4.6045,
        longitud=-74.0780,
        foto="perro-bulldog.jpg",
    )

    # Perdido: fue un Vecino Buena Pata y desaparecio de su territorio.
    tigre = inscribir(
        nombre="Tigre",
        especie=EspecieEnum.GATO,
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.MEDIANO,
        edad_estimada=5,
        descripcion="Gato naranja de andar tranquilo. Dormía cerca de la plaza del barrio.",
        barrio="Bosque Izquierdo",
        latitud=4.6085,
        longitud=-74.0625,
        foto="gato-naranja.jpg",
    )
    registrar_validacion(
        db, tigre.id, VETERINARIO, VeredictoValidacionEnum.APROBADO, [], "Cumple los criterios del programa.",
        esterilizado=True, numero_microchip="985141000102",
    )
    formalizar_vbp(db, tigre.id, LIDER)
    registrar_salida(
        db, tigre.id, CausalSalidaEnum.PERDIDA, _hace(6),
        "Los vecinos no lo ven desde hace una semana.", LIDER,
    )
    return True


def main() -> None:
    rehacer = "--rehacer" in sys.argv
    db = SessionLocal()
    try:
        creado = cargar_demo(db, crear_almacenamiento(get_settings()), rehacer=rehacer)
    finally:
        db.close()
    print("Animales de demostración cargados." if creado else "Los animales de demostración ya estaban cargados.")


if __name__ == "__main__":
    main()
