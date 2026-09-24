from app.services.mapa_publico import TAMANO_CELDA, aproximar_coordenada


def test_latitud_positiva_cae_en_el_centro_de_su_celda():
    assert aproximar_coordenada(4.6097) == 4.6095


def test_longitud_negativa_cae_en_el_centro_de_su_celda():
    assert aproximar_coordenada(-74.0817) == -74.0805


def test_dos_puntos_de_la_misma_celda_dan_el_mismo_resultado():
    assert aproximar_coordenada(4.6081) == aproximar_coordenada(4.6109) == 4.6095


def test_es_determinista():
    assert aproximar_coordenada(4.6097) == aproximar_coordenada(4.6097)


def test_el_resultado_queda_a_menos_de_media_celda_del_original():
    for valor in (4.6097, 4.5001, 4.7499, -74.0817, -74.1499, -73.9991):
        assert abs(aproximar_coordenada(valor) - valor) <= TAMANO_CELDA / 2 + 1e-9
