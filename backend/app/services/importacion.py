import csv
import io
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import CausalSalidaEnum, EspecieEnum, EstadoAnimalEnum, SexoEnum, TamanoEnum, TipoDocumentoEnum
from app.schemas.importacion import FilaImportacion, ResumenImportacion
from app.services.documentos import normalizar_numero_documento
from app.services.historial import registrar_evento
from app.services.inscripcion import es_incompleto
from app.services.inscriptores import obtener_o_crear_persona
from app.services.localidades import localidad_de_punto
from app.services.notificaciones_internas import notificar_incompleto

CAMPOS_OBLIGATORIOS = ("nombre", "sexo", "tamano", "barrio", "latitud", "longitud")


def _valor(fila: dict, campo: str) -> str | None:
    valor = (fila.get(campo) or "").strip()
    return valor if valor != "" else None


def _comunidad_por_nombre(db: Session, nombre: str | None) -> Comunidad | None:
    if nombre is None:
        return None
    return db.query(Comunidad).filter(Comunidad.nombre.ilike(nombre)).first()


def importar_csv(db: Session, contenido: bytes, inscrito_por: str) -> ResumenImportacion:
    texto = contenido.decode("utf-8-sig")
    lector = csv.DictReader(io.StringIO(texto))

    filas: list[FilaImportacion] = []
    importados = 0
    con_error = 0
    incompletos = 0

    for numero, cruda in enumerate(lector, start=2):  # fila 1 es el encabezado
        try:
            faltantes = [c for c in CAMPOS_OBLIGATORIOS if _valor(cruda, c) is None]
            if faltantes:
                raise ValueError(f"Faltan columnas obligatorias: {', '.join(faltantes)}.")

            comunidad = _comunidad_por_nombre(db, _valor(cruda, "comunidad"))

            persona_id = None
            tipo_documento_raw = _valor(cruda, "tipo_documento")
            numero_documento = _valor(cruda, "numero_documento")
            if tipo_documento_raw is not None and numero_documento is not None:
                tipo_documento = TipoDocumentoEnum(tipo_documento_raw.upper())
                normalizar_numero_documento(numero_documento)
                persona = obtener_o_crear_persona(
                    db, tipo_documento, numero_documento,
                    nombre=_valor(cruda, "nombre_inscriptor") or inscrito_por,
                    telefono="", correo="", barrio=_valor(cruda, "barrio") or "",
                )
                persona_id = persona.id

            estado_raw = _valor(cruda, "estado")
            estado = EstadoAnimalEnum(estado_raw.upper()) if estado_raw else EstadoAnimalEnum.CANDIDATO

            causal_raw = _valor(cruda, "causal_salida")
            causal_salida = CausalSalidaEnum(causal_raw.upper()) if causal_raw else None

            fecha_salida_raw = _valor(cruda, "fecha_salida")
            fecha_salida = (
                datetime.fromisoformat(fecha_salida_raw).replace(tzinfo=timezone.utc)
                if fecha_salida_raw
                else None
            )

            fecha_inscripcion_raw = _valor(cruda, "fecha_inscripcion")
            fecha_inscripcion = (
                datetime.fromisoformat(fecha_inscripcion_raw).replace(tzinfo=timezone.utc)
                if fecha_inscripcion_raw
                else None
            )

            latitud = float(_valor(cruda, "latitud"))
            longitud = float(_valor(cruda, "longitud"))

            animal = Animal(
                nombre=_valor(cruda, "nombre"),
                especie=EspecieEnum((_valor(cruda, "especie") or "PERRO").upper()),
                sexo=SexoEnum(_valor(cruda, "sexo").upper()),
                tamano=TamanoEnum(_valor(cruda, "tamano").upper()),
                barrio=_valor(cruda, "barrio"),
                latitud=latitud,
                longitud=longitud,
                localidad=localidad_de_punto(latitud, longitud),
                comunidad_id=comunidad.id if comunidad else None,
                persona_id=persona_id,
                estado=estado,
                causal_salida=causal_salida,
                fecha_salida=fecha_salida,
                notas_salida=_valor(cruda, "notas_salida"),
                inscrito_por=inscrito_por,
            )
            if fecha_inscripcion is not None:
                animal.fecha_inscripcion = fecha_inscripcion

            db.add(animal)
            db.commit()
            db.refresh(animal)

            registrar_evento(
                db, animal_id=animal.id, tipo_evento="INSCRIPCION", usuario=inscrito_por,
                detalle={"barrio": animal.barrio, "comunidad_id": animal.comunidad_id, "origen": "importacion_csv"},
            )

            incompleto = es_incompleto(animal)
            if incompleto:
                notificar_incompleto(db, animal)
                incompletos += 1
            importados += 1
            filas.append(FilaImportacion(fila=numero, estado="OK", animal_id=animal.id, incompleto=incompleto))
        except Exception as error:  # noqa: BLE001 - cada fila se reporta, no debe tumbar el resto
            db.rollback()
            con_error += 1
            filas.append(FilaImportacion(fila=numero, estado="ERROR", motivo=str(error)))

    return ResumenImportacion(
        total=len(filas), importados=importados, con_error=con_error, incompletos=incompletos, filas=filas
    )
