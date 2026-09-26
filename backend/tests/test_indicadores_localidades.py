from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.enums import (
    EspecieEnum,
    EstadoAnimalEnum,
    EstadoReporteEnum,
    RolUsuarioEnum,
    SexoEnum,
    TamanoEnum,
)
from app.models.reporte_novedad import ReporteNovedad
from app.models.usuario import Usuario
from tests.ayudas_inscripcion import crear_comunidad

client = TestClient(app)


def _encabezados(db, rol=RolUsuarioEnum.COMUNIDAD):
    db.add(Usuario(nombre="u", rol=rol, username="u", password_hash=hash_password("x")))
    db.commit()
    return {"Authorization": f"Bearer {create_access_token(subject='u', rol=rol.value)}"}


def _animal(db, comunidad_id, nombre, localidad, fecha, estado=EstadoAnimalEnum.CANDIDATO, especie=EspecieEnum.PERRO):
    animal = Animal(
        nombre=nombre,
        especie=especie,
        sexo=SexoEnum.MACHO,
        tamano=TamanoEnum.MEDIANO,
        estado=estado,
        barrio="b",
        latitud=4.6,
        longitud=-74.07,
        comunidad_id=comunidad_id,
        inscrito_por="demo",
        localidad=localidad,
        fecha_inscripcion=datetime(*fecha, 17, tzinfo=timezone.utc),  # mediodia en Bogota
    )
    db.add(animal)
    db.commit()
    return animal


def _obtener(encabezados, **parametros):
    respuesta = client.get("/api/v1/indicadores/localidades", params=parametros, headers=encabezados)
    assert respuesta.status_code == 200, respuesta.text
    return respuesta.json()


def _por_nombre(cuerpo):
    return {loc["nombre"]: loc for loc in cuerpo["localidades"]}


def _datos_de_ejemplo(db):
    comunidad = crear_comunidad(db)
    _animal(db, comunidad.id, "A", "Santa Fe", (2026, 7, 10), EstadoAnimalEnum.VBP_ACTIVO)
    _animal(db, comunidad.id, "B", "Santa Fe", (2026, 8, 5))
    _animal(db, comunidad.id, "C", "Kennedy", (2026, 8, 20), EstadoAnimalEnum.EN_PROCESO, EspecieEnum.GATO)
    _animal(db, comunidad.id, "D", "Suba", (2026, 9, 1))
    _animal(db, comunidad.id, "E", None, (2026, 9, 2))
    return comunidad


def test_requiere_sesion(db_session):
    assert client.get("/api/v1/indicadores/localidades").status_code == 401


def test_devuelve_las_20_localidades_aunque_no_tengan_animales(db_session):
    cuerpo = _obtener(_encabezados(db_session))

    assert len(cuerpo["localidades"]) == 20
    assert cuerpo["total_animales"] == 0
    assert all(loc["total"] == 0 for loc in cuerpo["localidades"])


def test_los_totales_por_localidad_y_estado_cuadran_con_la_base(db_session):
    _datos_de_ejemplo(db_session)

    cuerpo = _obtener(_encabezados(db_session))
    localidades = _por_nombre(cuerpo)

    assert cuerpo["total_animales"] == 5
    assert cuerpo["sin_localidad"] == 1
    assert localidades["Santa Fe"]["total"] == 2
    assert localidades["Santa Fe"]["por_estado"] == {"VBP_ACTIVO": 1, "CANDIDATO": 1}
    assert localidades["Kennedy"]["por_estado"] == {"EN_PROCESO": 1}
    assert localidades["Suba"]["total"] == 1
    assert sum(loc["total"] for loc in cuerpo["localidades"]) + cuerpo["sin_localidad"] == db_session.query(Animal).count()


def test_filtra_por_estado_y_por_especie(db_session):
    _datos_de_ejemplo(db_session)
    encabezados = _encabezados(db_session)

    activos = _por_nombre(_obtener(encabezados, estado="VBP_ACTIVO"))
    varios = _obtener(encabezados, estado=["VBP_ACTIVO", "EN_PROCESO"])
    gatos = _por_nombre(_obtener(encabezados, especie="GATO"))

    assert activos["Santa Fe"]["total"] == 1 and activos["Kennedy"]["total"] == 0
    assert varios["total_animales"] == 2
    assert gatos["Kennedy"]["total"] == 1 and gatos["Santa Fe"]["total"] == 0


def test_las_inscripciones_del_periodo_incluyen_el_ultimo_dia(db_session):
    _datos_de_ejemplo(db_session)

    cuerpo = _obtener(_encabezados(db_session), desde="2026-08-01", hasta="2026-08-20")
    localidades = _por_nombre(cuerpo)

    assert localidades["Santa Fe"]["inscripciones_periodo"] == 1  # B, el 5 de agosto
    assert localidades["Kennedy"]["inscripciones_periodo"] == 1  # C, el 20 de agosto: el ultimo dia cuenta
    assert localidades["Suba"]["inscripciones_periodo"] == 0
    # El total actual de cada localidad no depende del periodo.
    assert localidades["Santa Fe"]["total"] == 2


def test_una_fecha_inicial_posterior_a_la_final_se_rechaza(db_session):
    respuesta = client.get(
        "/api/v1/indicadores/localidades",
        params={"desde": "2026-09-01", "hasta": "2026-08-01"},
        headers=_encabezados(db_session),
    )

    assert respuesta.status_code == 422


def test_cuenta_los_reportes_por_localidad_del_animal(db_session):
    comunidad = crear_comunidad(db_session)
    santa_fe = _animal(db_session, comunidad.id, "A", "Santa Fe", (2026, 7, 10))
    for estado in (EstadoReporteEnum.NUEVO, EstadoReporteEnum.CERRADO, EstadoReporteEnum.EN_ATENCION):
        db_session.add(ReporteNovedad(animal_id=santa_fe.id, reportante_nombre="v", descripcion="d", estado=estado))
    db_session.commit()

    localidades = _por_nombre(_obtener(_encabezados(db_session)))

    assert localidades["Santa Fe"]["reportes"] == 3
    assert localidades["Santa Fe"]["reportes_abiertos"] == 2
    assert localidades["Kennedy"]["reportes"] == 0


def test_difusion_pesa_las_localidades_distintas_de_santa_fe_y_agrupa_por_mes(db_session):
    _datos_de_ejemplo(db_session)

    difusion = _obtener(_encabezados(db_session))["difusion"]

    assert difusion["total_inscripciones"] == 5
    assert difusion["en_santa_fe"] == 2
    assert difusion["sin_localidad"] == 1
    assert difusion["fuera_de_santa_fe"] == 2  # Kennedy y Suba; la sin localidad no cuenta ni dentro ni fuera
    assert difusion["peso_fuera_de_santa_fe"] == 40.0
    assert difusion["mensual"] == [
        {"mes": "2026-07", "santa_fe": 1, "otras": 0, "total": 1},
        {"mes": "2026-08", "santa_fe": 1, "otras": 1, "total": 2},
        {"mes": "2026-09", "santa_fe": 0, "otras": 2, "total": 2},
    ]


def test_difusion_sin_inscripciones_no_divide_por_cero(db_session):
    difusion = _obtener(_encabezados(db_session))["difusion"]

    assert difusion["peso_fuera_de_santa_fe"] == 0.0
    assert difusion["mensual"] == []


def test_un_dia_se_cuenta_en_hora_de_bogota(db_session):
    comunidad = crear_comunidad(db_session)
    # 2 a. m. UTC del 21 de agosto es todavia el 20 de agosto a las 9 p. m. en Bogota.
    animal = _animal(db_session, comunidad.id, "N", "Kennedy", (2026, 8, 21))
    animal.fecha_inscripcion = datetime(2026, 8, 21, 2, tzinfo=timezone.utc)
    db_session.commit()

    cuerpo = _obtener(_encabezados(db_session), desde="2026-08-20", hasta="2026-08-20")

    assert _por_nombre(cuerpo)["Kennedy"]["inscripciones_periodo"] == 1
    assert cuerpo["difusion"]["mensual"][0]["mes"] == "2026-08"
