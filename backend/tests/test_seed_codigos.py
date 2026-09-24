from app.core.config import get_settings
from app.models.collar_qr import CollarQr
from app.seed.seed import ejecutar_seed
from app.services.mapa_publico import listar_mapa_publico


def test_los_codigos_de_collar_del_seed_no_se_deducen_de_datos_publicos(db_session, monkeypatch, tmp_path):
    monkeypatch.setattr(get_settings(), "media_root", tmp_path)

    ejecutar_seed()

    publicos = listar_mapa_publico(db_session)
    assert publicos, "el seed debe dejar animales VBP activos en el mapa"
    codigos = {collar.codigo for collar in db_session.query(CollarQr).all()}
    derivables = {f"vbp-{item['id']:04d}{item['nombre'][:2].lower()}" for item in publicos}
    assert codigos.isdisjoint(derivables)
