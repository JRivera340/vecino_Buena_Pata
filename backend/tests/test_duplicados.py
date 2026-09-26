from app.models.enums import EspecieEnum
from app.services.duplicados import buscar_posible_duplicado, distancia_m, nombres_parecidos
from app.services.inscripcion import inscribir_animal
from tests.ayudas_inscripcion import crear_comunidad, datos_animal


def _inscribir_copito(db):
    comunidad = crear_comunidad(db)
    return inscribir_animal(db, datos_animal(comunidad.id, nombre="Copito"), "demo")


def test_nombres_parecidos_ignora_tildes_y_mayusculas():
    assert nombres_parecidos("Copito", "copíto")
    assert nombres_parecidos("Rocky", "Roky")
    assert not nombres_parecidos("Rocky", "Canela")


def test_distancia_entre_puntos_cercanos():
    assert 100 < distancia_m(4.6000, -74.0800, 4.6010, -74.0800) < 120


def test_marca_como_duplicado_al_mismo_animal_cerca(db_session):
    original = _inscribir_copito(db_session)

    encontrado = buscar_posible_duplicado(db_session, EspecieEnum.PERRO, "Copíto", 4.60005, -74.08005)

    assert encontrado is not None and encontrado.id == original.id


def test_no_marca_si_esta_a_mas_de_150_metros(db_session):
    _inscribir_copito(db_session)

    assert buscar_posible_duplicado(db_session, EspecieEnum.PERRO, "Copito", 4.6020, -74.0800) is None


def test_no_marca_si_es_otra_especie_o_otro_nombre(db_session):
    _inscribir_copito(db_session)

    assert buscar_posible_duplicado(db_session, EspecieEnum.GATO, "Copito", 4.6000, -74.0800) is None
    assert buscar_posible_duplicado(db_session, EspecieEnum.PERRO, "Canela", 4.6000, -74.0800) is None
