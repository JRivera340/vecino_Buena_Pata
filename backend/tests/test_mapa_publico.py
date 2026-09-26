from datetime import datetime, timezone

from app.models.enums import EstadoAnimalEnum, EstadoSaludEnum
from app.services.mapa_publico import (
    TAMANO_CELDA,
    aproximar_coordenada,
    listar_mapa_publico,
    obtener_hoja_vida_publica,
)
from tests.ayudas_mapa_publico import crear_animal, crear_visita


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

    assert set(item.keys()) == {"id", "nombre", "especie", "foto_principal", "barrio", "localidad", "latitud", "longitud"}


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


def test_hoja_de_vida_de_un_animal_activo(db_session):
    animal = crear_animal(
        db_session,
        nombre="Lulu",
        edad_estimada=4,
        descripcion="Sociable y tranquila.",
        foto_principal="lulu.jpg",
        esterilizado=True,
        numero_microchip="985112345678901",
    )

    hoja = obtener_hoja_vida_publica(db_session, animal.id)

    assert hoja["id"] == animal.id
    assert hoja["nombre"] == "Lulu"
    assert hoja["edad_estimada"] == 4
    assert hoja["descripcion"] == "Sociable y tranquila."
    assert hoja["foto_principal"] == "lulu.jpg"
    assert hoja["esterilizado"] is True
    assert hoja["tiene_microchip"] is True


def test_hoja_de_vida_no_expone_el_numero_de_microchip_ni_datos_internos(db_session):
    animal = crear_animal(db_session, numero_microchip="985112345678901")

    hoja = obtener_hoja_vida_publica(db_session, animal.id)

    assert set(hoja.keys()) == {
        "id", "nombre", "especie", "sexo", "tamano", "edad_estimada", "descripcion",
        "foto_principal", "barrio", "localidad", "fecha_inscripcion", "esterilizado", "tiene_microchip",
        "ultima_visita",
    }
    assert "985112345678901" not in str(hoja)


def test_hoja_de_vida_sin_microchip_indica_falso(db_session):
    animal = crear_animal(db_session, numero_microchip=None)

    assert obtener_hoja_vida_publica(db_session, animal.id)["tiene_microchip"] is False


def test_hoja_de_vida_con_campos_opcionales_nulos(db_session):
    animal = crear_animal(db_session, edad_estimada=None, descripcion=None, foto_principal=None)

    hoja = obtener_hoja_vida_publica(db_session, animal.id)

    assert hoja["edad_estimada"] is None
    assert hoja["descripcion"] is None
    assert hoja["foto_principal"] is None
    assert hoja["ultima_visita"] is None


def test_hoja_de_vida_devuelve_none_si_el_animal_no_es_publico(db_session):
    candidato = crear_animal(db_session, estado=EstadoAnimalEnum.CANDIDATO)
    perdido = crear_animal(db_session, estado=EstadoAnimalEnum.PERDIDO, collar_activo=False)
    collar_inactivo = crear_animal(db_session, collar_activo=False)
    sin_collar = crear_animal(db_session, con_collar=False)

    assert obtener_hoja_vida_publica(db_session, candidato.id) is None
    assert obtener_hoja_vida_publica(db_session, perdido.id) is None
    assert obtener_hoja_vida_publica(db_session, collar_inactivo.id) is None
    assert obtener_hoja_vida_publica(db_session, sin_collar.id) is None


def test_hoja_de_vida_devuelve_none_si_el_animal_no_existe(db_session):
    assert obtener_hoja_vida_publica(db_session, 9999) is None


def test_la_ultima_visita_es_la_mas_reciente_por_fecha(db_session):
    animal = crear_animal(db_session)
    crear_visita(db_session, animal.id, datetime(2026, 3, 1, tzinfo=timezone.utc), EstadoSaludEnum.MALO, 20.0)
    crear_visita(db_session, animal.id, datetime(2026, 5, 1, tzinfo=timezone.utc), EstadoSaludEnum.BUENO, 22.5)
    crear_visita(db_session, animal.id, datetime(2026, 4, 1, tzinfo=timezone.utc), EstadoSaludEnum.REGULAR, 21.0)

    visita = obtener_hoja_vida_publica(db_session, animal.id)["ultima_visita"]

    assert visita["estado_salud"] == EstadoSaludEnum.BUENO
    assert visita["peso_kg"] == 22.5
    assert visita["fecha"].month == 5


def test_la_ultima_visita_no_expone_observaciones_ni_responsable(db_session):
    animal = crear_animal(db_session)
    crear_visita(db_session, animal.id, datetime(2026, 5, 1, tzinfo=timezone.utc))

    visita = obtener_hoja_vida_publica(db_session, animal.id)["ultima_visita"]

    assert set(visita.keys()) == {"fecha", "estado_salud", "peso_kg"}
    assert "Nota interna" not in str(visita)


def test_la_ultima_visita_puede_no_tener_peso(db_session):
    animal = crear_animal(db_session)
    crear_visita(db_session, animal.id, datetime(2026, 5, 1, tzinfo=timezone.utc), peso_kg=None)

    assert obtener_hoja_vida_publica(db_session, animal.id)["ultima_visita"]["peso_kg"] is None
