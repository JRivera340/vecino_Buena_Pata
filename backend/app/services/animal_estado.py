from app.models.enums import VeredictoValidacionEnum


def criterios_cumplidos(
    esterilizado: bool,
    numero_microchip: str | None,
    veredicto: VeredictoValidacionEnum | None,
    pendientes: list[str],
) -> tuple[bool, list[str]]:
    faltantes: list[str] = []

    if veredicto is None:
        return False, ["El animal aun no tiene ninguna validacion registrada."]

    if veredicto != VeredictoValidacionEnum.APROBADO:
        faltantes.append("La ultima validacion no fue aprobada.")

    if not esterilizado:
        faltantes.append("Falta esterilizacion.")

    if numero_microchip is None:
        faltantes.append("Falta numero de microchip.")

    if "COMPORTAMIENTO" in pendientes:
        faltantes.append("Pendiente de comportamiento: aun no tiene buena convivencia con la comunidad.")

    if "SALUD" in pendientes:
        faltantes.append("Pendiente de salud: aun no tiene buena salud confirmada.")

    return len(faltantes) == 0, faltantes
