import os

import pytest

from tests.guardia_bd import validar_url_pruebas

try:
    os.environ["DATABASE_URL"] = validar_url_pruebas(os.environ.get("VBP_TEST_DATABASE_URL"))
except ValueError as error:
    pytest.exit(str(error), returncode=2)

from sqlalchemy.orm import Session  # noqa: E402

from app.core.db import Base, engine, SessionLocal  # noqa: E402
from app import models  # noqa: E402,F401  necesario para que Base.metadata conozca todas las tablas


@pytest.fixture()
def db_session() -> Session:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
