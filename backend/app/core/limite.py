from collections.abc import Callable
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.limite_peticion import LimitePeticion


def ip_cliente(request: Request) -> str:
    """Detras del proxy de Railway el ultimo valor de X-Forwarded-For lo agrega el propio proxy;
    los anteriores los puede escribir el cliente, asi que no se usan."""
    reenviado = request.headers.get("x-forwarded-for")
    if reenviado:
        return reenviado.split(",")[-1].strip()
    return request.client.host if request.client else "desconocida"


def contar_y_verificar(db: Session, clave: str, maximo: int, ventana_s: int) -> None:
    ahora = datetime.now(timezone.utc)
    desde = ahora - timedelta(seconds=ventana_s)
    db.query(LimitePeticion).filter(LimitePeticion.clave == clave, LimitePeticion.creada_en < desde).delete()
    usadas = db.query(LimitePeticion).filter(LimitePeticion.clave == clave, LimitePeticion.creada_en >= desde).count()
    if usadas >= maximo:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiadas solicitudes. Espera un momento e intentalo de nuevo.",
            headers={"Retry-After": str(ventana_s)},
        )
    db.add(LimitePeticion(clave=clave, creada_en=ahora))
    db.commit()


def limitar(nombre: str, maximo: int | Callable[[], int], ventana_s: int):
    """Dependencia: cuenta las peticiones por IP y ruta y responde 429 al pasar el maximo."""

    def dependencia(request: Request, db: Session = Depends(get_db)) -> None:
        tope = maximo() if callable(maximo) else maximo
        contar_y_verificar(db, f"{nombre}:{ip_cliente(request)}", tope, ventana_s)

    return dependencia
