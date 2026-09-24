from app.models.enums import EstadoAnimalEnum
from app.services.mapa_publico import TAMANO_CELDA, aproximar_coordenada, listar_mapa_publico
from tests.ayudas_mapa_publico import crear_animal


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


def test_el_mapa_lista_solo_animales_vbp_activo_con_collar_activo(db_session):
    activo = crear_animal(db_session, nombre="Activo")
    crear_animal(db_session, nombre="Candidato", estado=EstadoAnimalEnum.CANDIDATO)
    crear_animal(db_session, nombre="EnProceso", estado=EstadoAnimalEnum.EN_PROCESO)
    crear_animal(db_session, nombre="Perdido", estado=EstadoAnimalEnum.PERDIDO, collar_activo=False)
    crear_animal(db_session, nombre="Adoptado", estado=EstadoAnimalEnum.ADOPTADO, collar_activo=False)
    crear_animal(db_session, nombre="Fallecido", estado=EstadoAnimalEnum.FALLECIDO, collar_activo=False)
    crear_animal(db_session, nombre="CollarInactivo", collar_activo=False)
    crear_animal(db_session, nombre="SinCollar", con_collar=False)

    resultado = listar_mapa_publico(db_session)

    assert [item["id"] for item in resultado] == [activo.id]


def test_el_mapa_devuelve_coordenadas_aproximadas(db_session):
    crear_animal(db_session, latitud=4.6097, longitud=-74.0817)

    (item,) = listar_mapa_publico(db_session)

    assert item["latitud"] == 4.6095
    assert item["longitud"] == -74.0805


def test_el_mapa_solo_incluye_los_campos_publicos(db_session):
    crear_animal(db_session, numero_microchip="985112345678901")

    (item,) = listar_mapa_publico(db_session)

    assert set(item.keys()) == {"id", "nombre", "especie", "foto_principal", "barrio", "latitud", "longitud"}


def test_el_mapa_ordena_por_id_ascendente(db_session):
    primero = crear_animal(db_session, nombre="Primero")
    segundo = crear_animal(db_session, nombre="Segundo")

    resultado = listar_mapa_publico(db_session)

    assert [item["id"] for item in resultado] == [primero.id, segundo.id]


def test_el_mapa_vacio_devuelve_lista_vacia(db_session):
    assert listar_mapa_publico(db_session) == []


def test_el_mapa_acepta_animales_sin_foto(db_session):
    crear_animal(db_session, foto_principal=None)

    (item,) = listar_mapa_publico(db_session)

    assert item["foto_principal"] is None
