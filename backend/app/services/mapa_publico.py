import math

TAMANO_CELDA = 0.003


def aproximar_coordenada(valor: float) -> float:
    celda = math.floor(valor / TAMANO_CELDA)
    return round(celda * TAMANO_CELDA + TAMANO_CELDA / 2, 6)
