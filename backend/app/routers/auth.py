from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import create_access_token, verify_password
from app.models.usuario import Usuario
from app.schemas.auth import TokenSchema

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenSchema)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> TokenSchema:
    usuario = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    if usuario is None or not verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario o contrasena incorrectos")
    token = create_access_token(subject=usuario.username, rol=usuario.rol.value)
    return TokenSchema(access_token=token, token_type="bearer", rol=usuario.rol, nombre=usuario.nombre)
