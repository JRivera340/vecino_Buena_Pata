import io

import httpx
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.animal import Animal
from app.models.enums import RolUsuarioEnum
from app.models.evento_historial import EventoHistorial
from app.models.notificacion import Notificacion
from app.models.usuario import Usuario
from app.services import notificaciones
from app.services.inscripcion import inscribir_animal, radicado_de
from app.services.notificaciones import (
    ErrorEnvio,
    ProveedorResend,
    enviar_notificacion,
    registrar_notificaciones,
    reintentar_pendientes,
)
from app.services.plantillas_correo import correo_aviso_idpyba, correo_confirmacion
from tests.ayudas_inscripcion import crear_comunidad, datos_animal

client = TestClient(app)


class ProveedorFalso:
    def __init__(self, fallos_antes_de_enviar: int = 0):
        self.enviados: list[tuple[str, str]] = []
        self.pendientes_de_fallar = fallos_antes_de_enviar
        self.llamadas = 0

    def enviar(self, destinatario, asunto, html, texto):
        self.llamadas += 1
        if self.pendientes_de_fallar > 0:
            self.pendientes_de_fallar -= 1
            raise ErrorEnvio("proveedor caido")
        self.enviados.append((destinatario, asunto))


@pytest.fixture(autouse=True)
def _sin_esperas_ni_media(monkeypatch, tmp_path):
    monkeypatch.setattr(notificaciones, "ESPERAS_S", (0.0, 0.0))
    monkeypatch.setattr(get_settings(), "media_root", tmp_path)
    monkeypatch.setattr(get_settings(), "notify_idpyba_email", "idpyba@example.org")


def _animal(db, **cambios):
    comunidad = crear_comunidad(db)
    return inscribir_animal(db, datos_animal(comunidad.id, **cambios), "demo")


def _formulario(comunidad_id):
    salida = io.BytesIO()
    Image.new("RGB", (8, 8), "white").save(salida, format="JPEG")
    return (
        {
            "tipo_documento": "CC",
            "numero_documento": "1234567",
            "nombre_persona": "Ana Perez",
            "telefono": "3001234567",
            "correo": "ana@example.org",
            "acepta_datos": "true",
            "nombre": "Copito",
            "sexo": "MACHO",
            "tamano": "PEQUENO",
            "barrio": "Las Cruces",
            "latitud": "4.6",
            "longitud": "-74.08",
            "comunidad_id": str(comunidad_id),
        },
        [("foto", ("foto.jpg", salida.getvalue(), "image/jpeg"))],
    )


def test_una_inscripcion_publica_envia_dos_correos_y_los_deja_registrados(db_session, monkeypatch):
    proveedor = ProveedorFalso()
    monkeypatch.setattr(notificaciones, "obtener_proveedor", lambda settings=None: proveedor)
    comunidad = crear_comunidad(db_session)
    datos, archivos = _formulario(comunidad.id)

    respuesta = client.post("/api/v1/publico/inscripciones", data=datos, files=archivos)

    assert respuesta.status_code == 201
    assert sorted(destino for destino, _ in proveedor.enviados) == ["ana@example.org", "idpyba@example.org"]
    registradas = db_session.query(Notificacion).all()
    assert {n.estado for n in registradas} == {"enviado"}
    assert {n.tipo for n in registradas} == {"CONFIRMACION_PERSONA", "AVISO_IDPYBA"}
    eventos = db_session.query(EventoHistorial).filter_by(tipo_evento="NOTIFICACION").all()
    assert len(eventos) == 2 and "ana@example.org" not in str([e.detalle for e in eventos])


def test_la_inscripcion_responde_201_aunque_el_proveedor_falle(db_session, monkeypatch):
    proveedor = ProveedorFalso(fallos_antes_de_enviar=99)
    monkeypatch.setattr(notificaciones, "obtener_proveedor", lambda settings=None: proveedor)
    comunidad = crear_comunidad(db_session)
    datos, archivos = _formulario(comunidad.id)

    respuesta = client.post("/api/v1/publico/inscripciones", data=datos, files=archivos)

    assert respuesta.status_code == 201
    assert db_session.query(Animal).count() == 1
    registradas = db_session.query(Notificacion).all()
    assert {n.estado for n in registradas} == {"fallido"}
    assert all(n.intentos == 3 and n.ultimo_error == "proveedor caido" for n in registradas)


def test_sin_proveedor_configurado_queda_fallida_con_el_motivo(db_session, monkeypatch):
    monkeypatch.setattr(notificaciones, "obtener_proveedor", lambda settings=None: None)
    comunidad = crear_comunidad(db_session)
    datos, archivos = _formulario(comunidad.id)

    respuesta = client.post("/api/v1/publico/inscripciones", data=datos, files=archivos)

    assert respuesta.status_code == 201
    assert all("no esta configurado" in n.ultimo_error for n in db_session.query(Notificacion).all())


def test_reintenta_hasta_lograrlo(db_session):
    animal = _animal(db_session)
    [notificacion_id] = registrar_notificaciones(db_session, animal, None)
    proveedor = ProveedorFalso(fallos_antes_de_enviar=2)

    estado = enviar_notificacion(db_session, notificacion_id, proveedor)

    assert estado == "enviado"
    assert db_session.get(Notificacion, notificacion_id).intentos == 3
    assert proveedor.llamadas == 3


def test_reintentar_pendientes_recoge_las_fallidas_cuando_el_proveedor_vuelve(db_session):
    animal = _animal(db_session)
    registrar_notificaciones(db_session, animal, None)
    enviar_notificacion(db_session, 1, None)

    enviadas = reintentar_pendientes(db_session, ProveedorFalso())

    assert enviadas == 1
    assert db_session.get(Notificacion, 1).estado == "enviado"


def test_una_notificacion_enviada_no_se_repite(db_session):
    animal = _animal(db_session)
    [notificacion_id] = registrar_notificaciones(db_session, animal, None)
    proveedor = ProveedorFalso()
    enviar_notificacion(db_session, notificacion_id, proveedor)

    enviar_notificacion(db_session, notificacion_id, proveedor)

    assert proveedor.llamadas == 1


def test_la_inscripcion_interna_solo_avisa_a_idpyba(db_session, monkeypatch):
    proveedor = ProveedorFalso()
    monkeypatch.setattr(notificaciones, "obtener_proveedor", lambda settings=None: proveedor)
    comunidad = crear_comunidad(db_session)
    db_session.add(Usuario(nombre="vera", rol=RolUsuarioEnum.VETERINARIO, username="vera", password_hash=hash_password("x")))
    db_session.commit()
    token = create_access_token(subject="vera", rol="VETERINARIO")

    respuesta = client.post(
        "/api/v1/animales",
        json={"nombre": "Rocky", "sexo": "MACHO", "tamano": "MEDIANO", "barrio": "Bosa", "latitud": 4.6, "longitud": -74.1, "comunidad_id": comunidad.id},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 201
    assert [destino for destino, _ in proveedor.enviados] == ["idpyba@example.org"]


def test_sin_correo_de_idpyba_no_se_anota_ese_aviso(db_session, monkeypatch):
    monkeypatch.setattr(get_settings(), "notify_idpyba_email", None)
    animal = _animal(db_session)

    assert registrar_notificaciones(db_session, animal, None) == []


def test_las_plantillas_incluyen_radicado_y_enlace_y_escapan_el_html(db_session):
    animal = _animal(db_session, nombre="<b>Copito</b>")
    radicado = radicado_de(animal)

    asunto, html, texto = correo_confirmacion(animal, radicado, "Ana <script>")
    _, html_aviso, texto_aviso = correo_aviso_idpyba(animal, radicado, "https://app.example/animales/1", True)

    assert radicado in asunto and radicado in html and radicado in texto
    assert "<script>" not in html and "<b>Copito</b>" not in html
    assert "https://app.example/animales/1" in html_aviso and "https://app.example/animales/1" in texto_aviso
    assert "posible duplicado" in texto_aviso


def test_resend_envia_por_https_con_la_clave_y_el_remitente():
    recibidas = []

    def responder(peticion: httpx.Request) -> httpx.Response:
        recibidas.append(peticion)
        return httpx.Response(200, json={"id": "abc"})

    proveedor = ProveedorResend("clave-secreta", "VBP <no-responder@example.org>", httpx.Client(transport=httpx.MockTransport(responder)))

    proveedor.enviar("ana@example.org", "Asunto", "<p>hola</p>", "hola")

    peticion = recibidas[0]
    assert str(peticion.url) == "https://api.resend.com/emails"
    assert peticion.headers["Authorization"] == "Bearer clave-secreta"
    assert b"ana@example.org" in peticion.content and b"no-responder@example.org" in peticion.content


def test_resend_convierte_los_errores_del_proveedor_en_error_de_envio():
    proveedor = ProveedorResend("k", "a@b.co", httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(422, text="dominio no verificado"))))

    with pytest.raises(ErrorEnvio, match="422"):
        proveedor.enviar("ana@example.org", "A", "<p>x</p>", "x")


def test_obtener_proveedor_exige_clave_y_remitente(monkeypatch):
    configuracion = get_settings()
    monkeypatch.setattr(configuracion, "mail_api_key", None)
    assert notificaciones.obtener_proveedor(configuracion) is None

    monkeypatch.setattr(configuracion, "mail_api_key", "k")
    monkeypatch.setattr(configuracion, "mail_from", "VBP <a@b.co>")
    assert isinstance(notificaciones.obtener_proveedor(configuracion), ProveedorResend)
