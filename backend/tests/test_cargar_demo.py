from app.models.animal import Animal
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import EstadoAnimalEnum, TipoComunidadEnum
from app.seed.cargar_demo import DIRECTORIO_IMAGENES, cargar_demo
from app.services.almacenamiento import AlmacenamientoLocal
from app.services.inscripcion import inscribir_animal
from app.services.mapa_publico import listar_mapa_publico


def test_carga_cuatro_animales_en_estados_distintos(db_session, tmp_path):
    creado = cargar_demo(db_session, AlmacenamientoLocal(tmp_path))

    assert creado
    estados = {animal.estado for animal in db_session.query(Animal).all()}
    assert estados == {
        EstadoAnimalEnum.VBP_ACTIVO,
        EstadoAnimalEnum.EN_PROCESO,
        EstadoAnimalEnum.CANDIDATO,
        EstadoAnimalEnum.PERDIDO,
    }


def test_cada_animal_queda_con_su_foto_guardada(db_session, tmp_path):
    cargar_demo(db_session, AlmacenamientoLocal(tmp_path))

    for animal in db_session.query(Animal).all():
        assert animal.foto_principal
        assert (tmp_path / animal.foto_principal).exists()


def test_solo_el_animal_activo_sale_en_el_mapa_publico(db_session, tmp_path):
    cargar_demo(db_session, AlmacenamientoLocal(tmp_path))

    publicos = listar_mapa_publico(db_session)

    assert [item["nombre"] for item in publicos] == ["Copito"]


def test_el_animal_perdido_conserva_su_collar_desactivado(db_session, tmp_path):
    cargar_demo(db_session, AlmacenamientoLocal(tmp_path))

    perdido = db_session.query(Animal).filter_by(estado=EstadoAnimalEnum.PERDIDO).one()
    collar = db_session.query(CollarQr).filter_by(animal_id=perdido.id).one()

    assert collar.activo is False


def test_repetir_la_carga_no_duplica_los_animales(db_session, tmp_path):
    cargar_demo(db_session, AlmacenamientoLocal(tmp_path))

    creado = cargar_demo(db_session, AlmacenamientoLocal(tmp_path))

    assert not creado
    assert db_session.query(Animal).count() == 4


def test_rehacer_reemplaza_los_animales_de_demostracion(db_session, tmp_path):
    cargar_demo(db_session, AlmacenamientoLocal(tmp_path))

    cargar_demo(db_session, AlmacenamientoLocal(tmp_path), rehacer=True)

    assert db_session.query(Animal).count() == 4


def test_retira_los_datos_de_la_carga_de_prueba_anterior(db_session, tmp_path):
    anterior = Comunidad(
        nombre="Comunidad de prueba",
        tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="Prueba",
        telefono_contacto="3000000000",
        email_contacto="prueba@example.org",
    )
    db_session.add(anterior)
    db_session.commit()
    inscribir_animal(
        db_session,
        dict(
            nombre="Viejito", sexo="MACHO", tamano="MEDIANO", barrio="Bosa",
            latitud=4.6, longitud=-74.1, comunidad_id=anterior.id,
        ),
        inscrito_por="carga_xlsx",
    )

    cargar_demo(db_session, AlmacenamientoLocal(tmp_path))

    assert db_session.query(Animal).filter_by(nombre="Viejito").count() == 0
    assert db_session.query(Comunidad).filter_by(nombre="Comunidad de prueba").count() == 0


def test_las_imagenes_de_demostracion_pesan_poco():
    archivos = list(DIRECTORIO_IMAGENES.glob("*.jpg"))

    assert len(archivos) == 4
    assert all(archivo.stat().st_size < 150_000 for archivo in archivos)
