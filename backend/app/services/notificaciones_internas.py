from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.comunidad import Comunidad
from app.models.enums import RolUsuarioEnum
from app.models.notificacion_interna import NotificacionInterna
from app.models.usuario import Usuario

ROLES_BROADCAST = (RolUsuarioEnum.VETERINARIO, RolUsuarioEnum.UNIDAD_ESPECIAL)


def crear_notificaciones(
    db: Session, animal: Animal, origen_tipo: str, origen_id: int | None
) -> list[NotificacionInterna]:
    notificaciones: list[NotificacionInterna] = []

    for rol in ROLES_BROADCAST:
        usuarios_rol = db.query(Usuario).filter_by(rol=rol).all()
        for usuario_rol in usuarios_rol:
            notificaciones.append(
                NotificacionInterna(
                    animal_id=animal.id, origen_tipo=origen_tipo, origen_id=origen_id, usuario_id=usuario_rol.id
                )
            )

    comunidad = db.get(Comunidad, animal.comunidad_id)
    if comunidad is not None and comunidad.lider_id is not None:
        notificaciones.append(
            NotificacionInterna(animal_id=animal.id, origen_tipo=origen_tipo, origen_id=origen_id, usuario_id=comunidad.lider_id)
        )

    inscriptor = db.query(Usuario).filter_by(username=animal.inscrito_por).first()
    if inscriptor is not None:
        notificaciones.append(
            NotificacionInterna(animal_id=animal.id, origen_tipo=origen_tipo, origen_id=origen_id, usuario_id=inscriptor.id)
        )

    db.add_all(notificaciones)
    db.commit()
    return notificaciones
