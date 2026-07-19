from pathlib import Path

_SVG_SILUETA_PERRO = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<rect width="200" height="200" fill="#FAF6EF"/>
<circle cx="100" cy="100" r="70" fill="#C4552D"/>
<path d="M70 90 q30 -40 60 0 q10 40 -30 60 q-40 -20 -30 -60 z" fill="#FAF6EF"/>
</svg>"""


def generar_silueta_placeholder(media_root: Path) -> str:
    media_root.mkdir(parents=True, exist_ok=True)
    ruta = media_root / "perro-silueta.svg"
    ruta.write_text(_SVG_SILUETA_PERRO, encoding="utf-8")
    return "perro-silueta.svg"
