import pytest

from tests.guardia_bd import validar_url_pruebas


def test_acepta_una_base_cuyo_nombre_termina_en_test():
    url = "postgresql+psycopg://vbp:vbp@localhost:5432/vbp_test"
    assert validar_url_pruebas(url) == url


def test_acepta_parametros_de_consulta_despues_del_nombre():
    url = "postgresql+psycopg://vbp:vbp@localhost:5432/vbp_test?sslmode=require"
    assert validar_url_pruebas(url) == url


def test_rechaza_url_ausente_o_vacia():
    with pytest.raises(ValueError, match="VBP_TEST_DATABASE_URL"):
        validar_url_pruebas(None)
    with pytest.raises(ValueError, match="VBP_TEST_DATABASE_URL"):
        validar_url_pruebas("")


def test_rechaza_una_base_que_no_es_de_pruebas():
    url = "postgresql+psycopg://vbp:secreto@postgres-vbp.railway.internal:5432/vbp"
    with pytest.raises(ValueError, match="_test"):
        validar_url_pruebas(url)
