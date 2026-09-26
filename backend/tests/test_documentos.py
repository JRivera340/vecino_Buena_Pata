import pytest

from app.services.documentos import normalizar_numero_documento


def test_quita_puntos_espacios_y_guiones():
    assert normalizar_numero_documento("1.234.567-8") == "12345678"
    assert normalizar_numero_documento(" 1 234 567 ") == "1234567"


def test_pasa_a_mayusculas_los_documentos_con_letras():
    assert normalizar_numero_documento("ab-123456") == "AB123456"


@pytest.mark.parametrize("numero", ["", "   ", "123", "....", "1" * 21])
def test_rechaza_numeros_muy_cortos_muy_largos_o_vacios(numero):
    with pytest.raises(ValueError):
        normalizar_numero_documento(numero)
