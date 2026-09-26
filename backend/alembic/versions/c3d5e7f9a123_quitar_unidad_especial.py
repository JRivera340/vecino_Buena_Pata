"""quitar el rol Unidad Especial

Revision ID: c3d5e7f9a123
Revises: b2c4d6e8f012
Create Date: 2026-09-26 14:00:00
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c3d5e7f9a123"
down_revision: Union[str, None] = "b2c4d6e8f012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ROLES_NUEVOS = ("COMUNIDAD", "VETERINARIO", "LIDER", "ADMIN")
ROLES_ANTERIORES = ("COMUNIDAD", "VETERINARIO", "LIDER", "UNIDAD_ESPECIAL", "ADMIN")


def _cambiar_tipo(valores: tuple[str, ...]) -> None:
    """Postgres no permite quitar un valor de un enum: se crea el tipo nuevo y se pasa la columna."""
    op.execute("ALTER TYPE rolusuarioenum RENAME TO rolusuarioenum_anterior")
    postgresql.ENUM(*valores, name="rolusuarioenum").create(op.get_bind())
    op.execute("ALTER TABLE usuario ALTER COLUMN rol TYPE rolusuarioenum USING rol::text::rolusuarioenum")
    op.execute("DROP TYPE rolusuarioenum_anterior")


def upgrade() -> None:
    # Quien tenia ese rol pasa a Veterinario, que ahora atiende los reportes junto con el Admin.
    # Las atenciones ya registradas guardan el usuario como texto y no se tocan.
    op.execute("UPDATE usuario SET rol = 'VETERINARIO' WHERE rol = 'UNIDAD_ESPECIAL'")
    _cambiar_tipo(ROLES_NUEVOS)


def downgrade() -> None:
    # Se recupera el valor en el tipo; los usuarios que pasaron a Veterinario se quedan como estan.
    _cambiar_tipo(ROLES_ANTERIORES)
