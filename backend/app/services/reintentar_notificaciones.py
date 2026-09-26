"""Reenvia las notificaciones pendientes o fallidas.

Uso: python -m app.services.reintentar_notificaciones
"""

from app.core.db import SessionLocal
from app.services.notificaciones import obtener_proveedor, reintentar_pendientes


def main() -> None:
    db = SessionLocal()
    try:
        enviadas = reintentar_pendientes(db, obtener_proveedor())
    finally:
        db.close()
    print(f"Notificaciones enviadas: {enviadas}.")


if __name__ == "__main__":
    main()
