from datetime import datetime, timedelta

DIAS_CADENCIA = 120  # 4 meses
DIAS_AVISO_PROXIMO = 30

EstadoSeguimiento = str  # "AL_DIA" | "PROXIMO" | "VENCIDO" | "EN_CAMINO"


def calcular_estado_seguimiento(
    fecha_formalizacion: datetime,
    fecha_ultima_visita: datetime | None,
    en_camino_por: str | None,
    ahora: datetime,
) -> EstadoSeguimiento:
    if en_camino_por is not None:
        return "EN_CAMINO"
    base = fecha_ultima_visita or fecha_formalizacion
    vence = base + timedelta(days=DIAS_CADENCIA)
    if ahora >= vence:
        return "VENCIDO"
    if ahora >= vence - timedelta(days=DIAS_AVISO_PROXIMO):
        return "PROXIMO"
    return "AL_DIA"
