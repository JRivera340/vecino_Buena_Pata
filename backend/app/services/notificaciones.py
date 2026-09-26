import logging
import time
from datetime import datetime, timezone
from typing import Protocol

import httpx
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import SessionLocal
from app.models.animal import Animal
from app.models.notificacion import Notificacion
from app.models.persona import Persona
from app.services.historial import registrar_evento
from app.services.inscripcion import radicado_de
from app.services.plantillas_correo import correo_aviso_idpyba, correo_confirmacion

registro = logging.getLogger(__name__)

TIPO_CONFIRMACION = "CONFIRMACION_PERSONA"
TIPO_AVISO_IDPYBA = "AVISO_IDPYBA"

PENDIENTE, ENVIADO, FALLIDO = "pendiente", "enviado", "fallido"

MAX_INTENTOS = 3
# Espera antes del segundo y del tercer intento. Las pruebas la dejan en cero.
ESPERAS_S: tuple[float, ...] = (2.0, 6.0)
MAX_INTENTOS_TOTALES_REINTENTO = 6


class ErrorEnvio(Exception):
    """El proveedor no pudo enviar el correo. El mensaje queda guardado en la notificacion."""


class Proveedor(Protocol):
    def enviar(self, destinatario: str, asunto: str, html: str, texto: str) -> None: ...


class ProveedorResend:
    def __init__(self, api_key: str, remitente: str, cliente: httpx.Client | None = None):
        self.api_key = api_key
        self.remitente = remitente
        self.cliente = cliente or httpx.Client(timeout=10.0)

    def enviar(self, destinatario: str, asunto: str, html: str, texto: str) -> None:
        try:
            respuesta = self.cliente.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"from": self.remitente, "to": [destinatario], "subject": asunto, "html": html, "text": texto},
            )
        except httpx.HTTPError as error:
            raise ErrorEnvio(f"No se pudo conectar con el proveedor: {error.__class__.__name__}") from error
        if respuesta.status_code >= 300:
            raise ErrorEnvio(f"El proveedor respondio {respuesta.status_code}: {respuesta.text[:200]}")


def obtener_proveedor(settings: Settings | None = None) -> Proveedor | None:
    settings = settings or get_settings()
    if settings.mail_provider == "resend" and settings.mail_api_key and settings.mail_from:
        return ProveedorResend(settings.mail_api_key, settings.mail_from)
    return None


def registrar_notificaciones(db: Session, animal: Animal, persona: Persona | None, settings: Settings | None = None) -> list[int]:
    """Deja anotados los correos por enviar. Un animal inscrito por el personal solo genera el aviso a IDPYBA."""
    settings = settings or get_settings()
    destinos: list[tuple[str, str]] = []
    if persona is not None:
        destinos.append((TIPO_CONFIRMACION, persona.correo))
    if settings.notify_idpyba_email:
        destinos.append((TIPO_AVISO_IDPYBA, settings.notify_idpyba_email))
    notificaciones = [
        Notificacion(animal_id=animal.id, destinatario=destinatario, tipo=tipo, estado=PENDIENTE)
        for tipo, destinatario in destinos
    ]
    db.add_all(notificaciones)
    db.commit()
    return [notificacion.id for notificacion in notificaciones]


def _componer(db: Session, notificacion: Notificacion, settings: Settings) -> tuple[str, str, str]:
    animal = db.get(Animal, notificacion.animal_id)
    radicado = radicado_de(animal)
    if notificacion.tipo == TIPO_CONFIRMACION:
        persona = db.get(Persona, animal.persona_id)
        return correo_confirmacion(animal, radicado, persona.nombre if persona else "")
    enlace = f"{settings.frontend_base_url.rstrip('/')}/animales/{animal.id}"
    return correo_aviso_idpyba(animal, radicado, enlace, animal.posible_duplicado_de_id is not None)


def enviar_notificacion(db: Session, notificacion_id: int, proveedor: Proveedor | None, settings: Settings | None = None) -> str:
    """Intenta enviar hasta MAX_INTENTOS veces con espera creciente. Devuelve el estado final."""
    settings = settings or get_settings()
    notificacion = db.get(Notificacion, notificacion_id)
    if notificacion is None or notificacion.estado == ENVIADO:
        return ENVIADO if notificacion else FALLIDO

    if proveedor is None:
        notificacion.estado = FALLIDO
        notificacion.ultimo_error = "El proveedor de correo no esta configurado."
        db.commit()
        return FALLIDO

    asunto, html, texto = _componer(db, notificacion, settings)
    for intento in range(1, MAX_INTENTOS + 1):
        notificacion.intentos += 1
        try:
            proveedor.enviar(notificacion.destinatario, asunto, html, texto)
        except Exception as error:  # noqa: BLE001 - cualquier fallo del proveedor se guarda y se reintenta
            notificacion.estado = FALLIDO
            notificacion.ultimo_error = str(error)[:500]
            db.commit()
            registro.warning("Fallo el envio de la notificacion %s (intento %s): %s", notificacion.id, intento, error)
            if intento < MAX_INTENTOS:
                time.sleep(ESPERAS_S[min(intento - 1, len(ESPERAS_S) - 1)])
            continue
        notificacion.estado = ENVIADO
        notificacion.ultimo_error = None
        notificacion.enviada_en = datetime.now(timezone.utc)
        db.commit()
        registrar_evento(
            db,
            animal_id=notificacion.animal_id,
            tipo_evento="NOTIFICACION",
            usuario="sistema",
            detalle={"tipo": notificacion.tipo, "estado": ENVIADO},
        )
        return ENVIADO
    return FALLIDO


def procesar_notificaciones(ids: list[int]) -> None:
    """Tarea en segundo plano: abre su propia sesion porque la de la peticion ya se cerro."""
    proveedor = obtener_proveedor()
    db = SessionLocal()
    try:
        for notificacion_id in ids:
            try:
                enviar_notificacion(db, notificacion_id, proveedor)
            except Exception:  # noqa: BLE001 - un correo no debe impedir enviar los demas
                registro.exception("Error inesperado con la notificacion %s", notificacion_id)
                db.rollback()
    finally:
        db.close()


def reintentar_pendientes(db: Session, proveedor: Proveedor | None) -> int:
    """Reenvia las que quedaron pendientes o fallidas (por ejemplo, tras un reinicio)."""
    pendientes = (
        db.query(Notificacion)
        .filter(Notificacion.estado.in_([PENDIENTE, FALLIDO]), Notificacion.intentos < MAX_INTENTOS_TOTALES_REINTENTO)
        .order_by(Notificacion.id)
        .all()
    )
    enviadas = 0
    for notificacion in pendientes:
        if enviar_notificacion(db, notificacion.id, proveedor) == ENVIADO:
            enviadas += 1
    return enviadas
