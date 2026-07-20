from app.services.qr import generar_imagen_qr


def test_generar_imagen_qr_devuelve_png_valido():
    imagen = generar_imagen_qr("vbp-abc123")
    assert imagen[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(imagen) > 100
