"""notificacion interna

Revision ID: c5e6f7a8b905
Revises: b4d5e6f7a804
Create Date: 2026-09-30 09:40:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c5e6f7a8b905"
down_revision: Union[str, None] = "b4d5e6f7a804"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notificacion_interna",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("animal_id", sa.Integer(), sa.ForeignKey("animal.id"), index=True, nullable=False),
        sa.Column("origen_tipo", sa.String(30), nullable=False),
        sa.Column("origen_id", sa.Integer(), nullable=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuario.id"), index=True, nullable=True),
        sa.Column("rol", sa.String(30), index=True, nullable=True),
        sa.Column("creada_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("leida_en", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("notificacion_interna")
