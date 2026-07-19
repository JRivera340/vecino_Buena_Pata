import pytest
from jose import JWTError

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


def test_hash_password_y_verify_password_correctos():
    hash_generado = hash_password("vbp2026")
    assert hash_generado != "vbp2026"
    assert verify_password("vbp2026", hash_generado) is True


def test_verify_password_rechaza_password_incorrecta():
    hash_generado = hash_password("vbp2026")
    assert verify_password("otra-clave", hash_generado) is False


def test_create_y_decode_access_token_roundtrip():
    token = create_access_token(subject="dr.rojas", rol="VETERINARIO")
    payload = decode_access_token(token)
    assert payload["sub"] == "dr.rojas"
    assert payload["rol"] == "VETERINARIO"


def test_decode_access_token_rechaza_token_invalido():
    with pytest.raises(JWTError):
        decode_access_token("token-invalido")
