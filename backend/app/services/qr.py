import io

import qrcode

from app.core.config import get_settings


def generar_imagen_qr(codigo: str) -> bytes:
    settings = get_settings()
    url = f"{settings.frontend_base_url}/v/{codigo}"
    imagen = qrcode.make(url)
    buffer = io.BytesIO()
    imagen.save(buffer, format="PNG")
    return buffer.getvalue()
