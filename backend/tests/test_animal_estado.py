from app.models.enums import VeredictoValidacionEnum
from app.services.animal_estado import criterios_cumplidos


def test_cumple_los_cuatro_criterios():
    cumple, faltantes = criterios_cumplidos(
        esterilizado=True,
        numero_microchip="985141900001",
        veredicto=VeredictoValidacionEnum.APROBADO,
        pendientes=[],
    )
    assert cumple is True
    assert faltantes == []


def test_no_cumple_sin_esterilizar():
    cumple, faltantes = criterios_cumplidos(
        esterilizado=False,
        numero_microchip="985141900001",
        veredicto=VeredictoValidacionEnum.APROBADO,
        pendientes=[],
    )
    assert cumple is False
    assert "esterilizacion" in faltantes[0].lower()


def test_no_cumple_sin_microchip():
    cumple, faltantes = criterios_cumplidos(
        esterilizado=True,
        numero_microchip=None,
        veredicto=VeredictoValidacionEnum.APROBADO,
        pendientes=[],
    )
    assert cumple is False
    assert any("chip" in razon.lower() for razon in faltantes)


def test_no_cumple_con_pendientes_de_comportamiento_o_salud():
    cumple, faltantes = criterios_cumplidos(
        esterilizado=True,
        numero_microchip="985141900001",
        veredicto=VeredictoValidacionEnum.APROBADO,
        pendientes=["COMPORTAMIENTO"],
    )
    assert cumple is False
    assert len(faltantes) == 1


def test_no_cumple_sin_veredicto_aprobado():
    cumple, faltantes = criterios_cumplidos(
        esterilizado=True,
        numero_microchip="985141900001",
        veredicto=VeredictoValidacionEnum.CON_PENDIENTES,
        pendientes=[],
    )
    assert cumple is False
    assert len(faltantes) >= 1


def test_no_cumple_sin_validacion_previa():
    cumple, faltantes = criterios_cumplidos(
        esterilizado=False,
        numero_microchip=None,
        veredicto=None,
        pendientes=[],
    )
    assert cumple is False
    assert len(faltantes) >= 1
