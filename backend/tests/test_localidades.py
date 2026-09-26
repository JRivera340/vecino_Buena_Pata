import pytest

from app.models.animal import Animal
from app.services.inscripcion import inscribir_animal
from app.services.localidades import Localidad, Poligono, cargar_localidades, localidad_de_punto
from tests.ayudas_inscripcion import crear_comunidad, datos_animal


def test_el_archivo_trae_las_20_localidades_de_bogota():
    nombres = {localidad.nombre for localidad in cargar_localidades()}

    assert len(nombres) == 20
    assert {"Santa Fe", "Usaquén", "Ciudad Bolívar", "Sumapaz", "La Candelaria"} <= nombres


@pytest.mark.parametrize(
    ("latitud", "longitud", "esperada"),
    [
        (4.5981, -74.0758, "La Candelaria"),  # Plaza de Bolivar
        (4.6021, -74.0691, "Santa Fe"),  # Torre Colpatria
        (4.6058, -74.0561, "Santa Fe"),  # Monserrate
        (4.6760, -74.0480, "Chapinero"),  # Parque de la 93
        (4.6945, -74.0306, "Usaquén"),  # Parque de Usaquen
        (4.6382, -74.0840, "Teusaquillo"),  # Universidad Nacional
        (4.6050, -74.1900, "Bosa"),
    ],
)
def test_un_punto_dentro_de_bogota_devuelve_su_localidad(latitud, longitud, esperada):
    assert localidad_de_punto(latitud, longitud) == esperada


@pytest.mark.parametrize(("latitud", "longitud"), [(6.2442, -75.5812), (0.0, 0.0), (4.6097, -73.5)])
def test_un_punto_fuera_de_bogota_devuelve_none(latitud, longitud):
    assert localidad_de_punto(latitud, longitud) is None


def _cuadrado(x0, y0, x1, y1):
    anillo = [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]
    return anillo, (x0, y0, x1, y1)


def test_un_punto_dentro_de_un_hueco_no_pertenece_al_poligono():
    exterior, caja = _cuadrado(0, 0, 10, 10)
    hueco, _ = _cuadrado(4, 4, 6, 6)
    localidad = Localidad("99", "Con hueco", [Poligono(exterior, [hueco], caja)])

    assert localidad_de_punto(2, 2, [localidad]) == "Con hueco"
    assert localidad_de_punto(5, 5, [localidad]) is None


def test_un_multipoligono_reconoce_cualquiera_de_sus_partes():
    a, caja_a = _cuadrado(0, 0, 1, 1)
    b, caja_b = _cuadrado(5, 5, 6, 6)
    localidad = Localidad("98", "Dos partes", [Poligono(a, [], caja_a), Poligono(b, [], caja_b)])

    assert localidad_de_punto(0.5, 0.5, [localidad]) == "Dos partes"
    assert localidad_de_punto(5.5, 5.5, [localidad]) == "Dos partes"
    assert localidad_de_punto(3, 3, [localidad]) is None


def test_al_inscribir_se_calcula_la_localidad(db_session):
    comunidad = crear_comunidad(db_session)

    dentro = inscribir_animal(db_session, datos_animal(comunidad.id, latitud=4.6021, longitud=-74.0691), "demo")
    fuera = inscribir_animal(db_session, datos_animal(comunidad.id, nombre="Lejos", latitud=6.2442, longitud=-75.5812), "demo")

    assert db_session.get(Animal, dentro.id).localidad == "Santa Fe"
    assert db_session.get(Animal, fuera.id).localidad is None
