import re

_NO_ALFANUMERICO = re.compile(r"[^A-Z0-9]")
_LARGO_MINIMO = 4
_LARGO_MAXIMO = 20


def normalizar_numero_documento(numero: str) -> str:
    """Deja solo letras y digitos en mayusculas: '1.234.567-8' y '12345678' son el mismo documento."""
    limpio = _NO_ALFANUMERICO.sub("", numero.upper())
    if not (_LARGO_MINIMO <= len(limpio) <= _LARGO_MAXIMO):
        raise ValueError(
            f"El numero de documento debe tener entre {_LARGO_MINIMO} y {_LARGO_MAXIMO} caracteres."
        )
    return limpio
