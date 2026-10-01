"""comunidad_id en usuario

Revision ID: f2b3c4d5e602
Revises: e1a2b3c4d501
Create Date: 2026-09-30 09:10:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f2b3c4d5e602"
down_revision: Union[str, None] = "e1a2b3c4d501"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("usuario", sa.Column("comunidad_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_usuario_comunidad_id", "usuario", "comunidad", ["comunidad_id"], ["id"]
    )
    # Backfill: todo lider ya creado queda ligado a la comunidad que lidera.
    conexion = op.get_bind()
    conexion.execute(
        sa.text(
            "UPDATE usuario SET comunidad_id = comunidad.id "
            "FROM comunidad WHERE comunidad.lider_id = usuario.id"
        )
    )


def downgrade() -> None:
    op.drop_constraint("fk_usuario_comunidad_id", "usuario", type_="foreignkey")
    op.drop_column("usuario", "comunidad_id")
