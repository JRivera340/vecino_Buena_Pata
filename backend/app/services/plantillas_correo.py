from html import escape

from app.models.animal import Animal

VERDE = "#55711f"
TINTA = "#252525"
FONDO = "#fafafa"


def _marco(titulo: str, cuerpo_html: str) -> str:
    return (
        f'<!doctype html><html lang="es"><body style="margin:0;background:{FONDO};font-family:system-ui,Arial,sans-serif;color:{TINTA}">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">'
        '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e5e5;border-radius:8px">'
        f'<tr><td style="background:{VERDE};color:#ffffff;padding:16px 24px;font-size:18px;font-weight:600;border-radius:8px 8px 0 0">Vecino Buena Pata</td></tr>'
        f'<tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px">{escape(titulo)}</h1>{cuerpo_html}</td></tr>'
        '<tr><td style="padding:16px 24px;font-size:12px;color:#5c5c5c;border-top:1px solid #e5e5e5">'
        "Alcaldía Local de Santa Fe &middot; Observatorio de Protección y Bienestar Animal (PYBA)</td></tr>"
        "</table></td></tr></table></body></html>"
    )


def correo_confirmacion(animal: Animal, radicado: str, nombre_persona: str) -> tuple[str, str, str]:
    asunto = f"Recibimos la inscripción de {animal.nombre} ({radicado})"
    cuerpo = (
        f"<p>Hola, {escape(nombre_persona)}.</p>"
        f"<p>Tu inscripción de <strong>{escape(animal.nombre)}</strong> quedó registrada.</p>"
        f'<p>Tu número de radicado es <strong style="color:{VERDE}">{escape(radicado)}</strong>.</p>'
        "<p>Lo que sigue: un veterinario revisará al animal. Si cumple los criterios del programa "
        "(esterilización, microchip y buena convivencia), el líder de la comunidad lo formaliza y recibe su collar con código QR.</p>"
        "<p>Te avisaremos si necesitamos algún dato adicional.</p>"
    )
    texto = (
        f"Hola, {nombre_persona}.\n\n"
        f"Tu inscripción de {animal.nombre} quedó registrada.\n"
        f"Tu número de radicado es {radicado}.\n\n"
        "Lo que sigue: un veterinario revisará al animal. Si cumple los criterios del programa "
        "(esterilización, microchip y buena convivencia), el líder de la comunidad lo formaliza y recibe su collar con código QR.\n\n"
        "Te avisaremos si necesitamos algún dato adicional.\n\n"
        "Alcaldía Local de Santa Fe - Observatorio PYBA"
    )
    return asunto, _marco("Recibimos tu inscripción", cuerpo), texto


def correo_aviso_idpyba(animal: Animal, radicado: str, enlace_ficha: str, posible_duplicado: bool) -> tuple[str, str, str]:
    asunto = f"Nuevo animal inscrito: {animal.nombre} ({radicado})"
    aviso_duplicado = (
        '<p style="color:#b02a37"><strong>Atención:</strong> el sistema lo marcó como posible duplicado de otro animal cercano.</p>'
        if posible_duplicado
        else ""
    )
    cuerpo = (
        f"<p>Se inscribió un animal nuevo: <strong>{escape(animal.nombre)}</strong>, barrio {escape(animal.barrio)}.</p>"
        f"<p>Radicado: <strong>{escape(radicado)}</strong>.</p>"
        f"{aviso_duplicado}"
        f'<p><a href="{escape(enlace_ficha)}" style="color:#0345bf">Abrir la ficha interna</a></p>'
    )
    texto = (
        f"Se inscribió un animal nuevo: {animal.nombre}, barrio {animal.barrio}.\n"
        f"Radicado: {radicado}.\n"
        + ("Atención: el sistema lo marcó como posible duplicado de otro animal cercano.\n" if posible_duplicado else "")
        + f"Ficha interna: {enlace_ficha}\n"
    )
    return asunto, _marco("Nuevo animal inscrito", cuerpo), texto
