from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.enums import EspecieEnum, EstadoAnimalEnum, EstadoReporteEnum
from app.models.reporte_novedad import ReporteNovedad
from app.schemas.indicadores import Difusion, IndicadoresLocalidades, IndicadorLocalidad, InscripcionesDelMes
from app.services.localidades import listar_localidades

LOCALIDAD_DE_LA_ALCALDIA = "Santa Fe"
# Colombia no tiene horario de verano: siempre UTC-5. Los dias y los meses se cuentan en hora de Bogota.
HORA_DE_BOGOTA = timezone(timedelta(hours=-5))


def _limites(desde: date | None, hasta: date | None) -> tuple[datetime | None, datetime | None]:
    """`hasta` es inclusivo: se cuenta todo el dia, en hora de Bogota."""
    inicio = datetime.combine(desde, time.min, tzinfo=HORA_DE_BOGOTA) if desde else None
    fin = datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=HORA_DE_BOGOTA) if hasta else None
    # Se pasan a UTC para que la comparacion sea la misma en cualquier motor (SQLite ignora la zona horaria).
    return (
        inicio.astimezone(timezone.utc) if inicio else None,
        fin.astimezone(timezone.utc) if fin else None,
    )


def _mes(db: Session, columna):
    if db.get_bind().dialect.name == "sqlite":
        return func.strftime("%Y-%m", columna, "-5 hours")
    return func.to_char(func.timezone("America/Bogota", columna), "YYYY-MM")


def calcular_indicadores(
    db: Session,
    desde: date | None = None,
    hasta: date | None = None,
    estados: list[EstadoAnimalEnum] | None = None,
    especie: EspecieEnum | None = None,
) -> IndicadoresLocalidades:
    inicio, fin = _limites(desde, hasta)

    def filtros_animal():
        condiciones = []
        if estados:
            condiciones.append(Animal.estado.in_(estados))
        if especie is not None:
            condiciones.append(Animal.especie == especie)
        return condiciones

    def en_el_periodo():
        condiciones = []
        if inicio is not None:
            condiciones.append(Animal.fecha_inscripcion >= inicio)
        if fin is not None:
            condiciones.append(Animal.fecha_inscripcion < fin)
        return condiciones

    # Total de animales por localidad y estado (todo el tiempo, con los filtros de estado y especie).
    filas = (
        db.query(Animal.localidad, Animal.estado, func.count(Animal.id))
        .filter(*filtros_animal())
        .group_by(Animal.localidad, Animal.estado)
        .all()
    )
    por_estado: dict[str | None, dict[str, int]] = {}
    for localidad, estado, cantidad in filas:
        por_estado.setdefault(localidad, {})[estado.value] = cantidad

    inscripciones = dict(
        db.query(Animal.localidad, func.count(Animal.id))
        .filter(*filtros_animal(), *en_el_periodo())
        .group_by(Animal.localidad)
        .all()
    )

    abierto = case((ReporteNovedad.estado != EstadoReporteEnum.CERRADO, 1), else_=0)
    reportes = {
        localidad: (total, abiertos or 0)
        for localidad, total, abiertos in db.query(Animal.localidad, func.count(ReporteNovedad.id), func.sum(abierto))
        .join(Animal, Animal.id == ReporteNovedad.animal_id)
        .filter(*filtros_animal())
        .group_by(Animal.localidad)
        .all()
    }

    localidades = []
    for codigo, nombre in listar_localidades():
        de_la_localidad = por_estado.get(nombre, {})
        total_reportes, abiertos = reportes.get(nombre, (0, 0))
        localidades.append(
            IndicadorLocalidad(
                codigo=codigo,
                nombre=nombre,
                total=sum(de_la_localidad.values()),
                por_estado=de_la_localidad,
                inscripciones_periodo=inscripciones.get(nombre, 0),
                reportes=total_reportes,
                reportes_abiertos=int(abiertos),
            )
        )

    total_animales = sum(sum(estados_de_la_localidad.values()) for estados_de_la_localidad in por_estado.values())
    sin_localidad = sum(por_estado.get(None, {}).values())

    # Difusion: de donde vienen las inscripciones del periodo y como evolucionan mes a mes.
    mes = _mes(db, Animal.fecha_inscripcion)
    es_santa_fe = case((Animal.localidad == LOCALIDAD_DE_LA_ALCALDIA, 1), else_=0)
    por_mes = (
        db.query(mes, func.sum(es_santa_fe), func.count(Animal.id))
        .filter(*filtros_animal(), *en_el_periodo())
        .group_by(mes)
        .order_by(mes)
        .all()
    )
    mensual = [
        InscripcionesDelMes(
            mes=mes_texto,
            santa_fe=int(santa_fe or 0),
            otras=int(total) - int(santa_fe or 0),
            total=int(total),
        )
        for mes_texto, santa_fe, total in por_mes
    ]
    total_inscripciones = sum(fila.total for fila in mensual)
    en_santa_fe = sum(fila.santa_fe for fila in mensual)
    sin_localidad_periodo = inscripciones.get(None, 0)
    fuera = total_inscripciones - en_santa_fe - sin_localidad_periodo

    return IndicadoresLocalidades(
        desde=desde,
        hasta=hasta,
        total_animales=total_animales,
        sin_localidad=sin_localidad,
        localidades=localidades,
        difusion=Difusion(
            total_inscripciones=total_inscripciones,
            en_santa_fe=en_santa_fe,
            fuera_de_santa_fe=fuera,
            sin_localidad=sin_localidad_periodo,
            peso_fuera_de_santa_fe=round(100 * fuera / total_inscripciones, 1) if total_inscripciones else 0.0,
            mensual=mensual,
        ),
    )
