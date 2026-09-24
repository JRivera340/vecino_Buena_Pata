def validar_url_pruebas(url: str | None) -> str:
    if not url:
        raise ValueError("Define VBP_TEST_DATABASE_URL con la URL de una base de pruebas.")
    nombre_bd = url.rsplit("/", 1)[-1].split("?", 1)[0]
    if not nombre_bd.endswith("_test"):
        raise ValueError(
            f"La base '{nombre_bd}' no termina en _test. Las pruebas borran todas las tablas "
            "y no pueden correr contra ella."
        )
    return url
