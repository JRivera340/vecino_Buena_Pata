from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum, TipoDocumentoEnum
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCrear, UsuarioEditar, UsuarioSchema
from app.services.documentos import normalizar_numero_documento


class UsuarioInvalido(ValueError):
    def __init__(self, mensaje: str, estado: int = 422):
        super().__init__(mensaje)
        self.estado = estado


def _documento(tipo: TipoDocumentoEnum | None, numero: str | None) -> tuple[TipoDocumentoEnum | None, str | None]:
    if tipo is None and not numero:
        return None, None
    if tipo is None or not numero:
        raise UsuarioInvalido("Indica el tipo y el numero de documento.")
    try:
        return tipo, normalizar_numero_documento(numero)
    except ValueError as error:
        raise UsuarioInvalido(str(error)) from error


def _verificar_documento_libre(db: Session, tipo, numero, excepto_id: int | None = None) -> None:
    if tipo is None:
        return
    existente = db.query(Usuario).filter_by(tipo_documento=tipo, numero_documento=numero).first()
    if existente is not None and existente.id != excepto_id:
        raise UsuarioInvalido("Ya existe un usuario con ese documento.", 409)


def a_esquema(db: Session, usuario: Usuario) -> UsuarioSchema:
    comunidad = db.query(Comunidad).filter_by(lider_id=usuario.id).first()
    esquema = UsuarioSchema.model_validate(usuario)
    esquema.comunidad_id = comunidad.id if comunidad else None
    esquema.comunidad_nombre = comunidad.nombre if comunidad else None
    return esquema


def listar_usuarios(db: Session) -> list[UsuarioSchema]:
    return [a_esquema(db, usuario) for usuario in db.query(Usuario).order_by(Usuario.nombre).all()]


def crear_usuario(db: Session, datos: UsuarioCrear) -> UsuarioSchema:
    tipo, numero = _documento(datos.tipo_documento, datos.numero_documento)
    es_lider = datos.rol == RolUsuarioEnum.LIDER
    if es_lider:
        if tipo is None:
            raise UsuarioInvalido("Un lider debe tener tipo y numero de documento.")
        if datos.comunidad_id is None and datos.comunidad_nueva is None:
            raise UsuarioInvalido("Un lider representa a una comunidad: elige una o crea una nueva.")
    if db.query(Usuario).filter_by(username=datos.username).first():
        raise UsuarioInvalido("Ya existe un usuario con ese nombre de usuario.", 409)
    _verificar_documento_libre(db, tipo, numero)

    comunidad = None
    if es_lider:
        if datos.comunidad_id is not None:
            comunidad = db.get(Comunidad, datos.comunidad_id)
            if comunidad is None:
                raise UsuarioInvalido("La comunidad elegida no existe.")
            if comunidad.lider_id is not None:
                raise UsuarioInvalido("Esa comunidad ya tiene un lider.", 409)
        else:
            comunidad = Comunidad(**datos.comunidad_nueva.model_dump())
            db.add(comunidad)

    usuario = Usuario(
        nombre=datos.nombre.strip(),
        username=datos.username,
        rol=datos.rol,
        password_hash=hash_password(datos.password),
        tipo_documento=tipo,
        numero_documento=numero,
    )
    db.add(usuario)
    db.flush()
    if comunidad is not None:
        comunidad.lider_id = usuario.id
    db.commit()
    db.refresh(usuario)
    return a_esquema(db, usuario)


def editar_usuario(db: Session, usuario_id: int, datos: UsuarioEditar) -> UsuarioSchema:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise UsuarioInvalido("Usuario no encontrado.", 404)

    if datos.tipo_documento is not None or datos.numero_documento is not None:
        tipo, numero = _documento(datos.tipo_documento or usuario.tipo_documento, datos.numero_documento or usuario.numero_documento)
        _verificar_documento_libre(db, tipo, numero, excepto_id=usuario.id)
        usuario.tipo_documento, usuario.numero_documento = tipo, numero
    if datos.nombre is not None:
        usuario.nombre = datos.nombre.strip()
    if datos.password is not None:
        usuario.password_hash = hash_password(datos.password)
    db.commit()
    db.refresh(usuario)
    return a_esquema(db, usuario)
