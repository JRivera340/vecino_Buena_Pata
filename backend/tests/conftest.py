import pytest
from sqlalchemy.orm import Session

from app.core.db import Base, engine, SessionLocal
from app import models  # noqa: F401  necesario para que Base.metadata conozca todas las tablas


@pytest.fixture()
def db_session() -> Session:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
