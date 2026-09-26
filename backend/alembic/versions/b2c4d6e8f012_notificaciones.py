"""notificaciones por correo

Revision ID: b2c4d6e8f012
Revises: a1f3c5d7e901
Create Date: 2026-09-26 12:00:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c4d6e8f012"
down_revision: Union[str, None] = "a1f3c5d7e901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notificacion",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("animal_id", sa.Integer(), sa.ForeignKey("animal.id"), nullable=False),
        sa.Column("destinatario", sa.String(160), nullable=False),
        sa.Column("tipo", sa.String(40), nullable=False),
        sa.Column("estado", sa.String(20), nullable=False),
        sa.Column("intentos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ultimo_error", sa.String(500), nullable=True),
        sa.Column("creada_en", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("enviada_en", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_notificacion_animal_id", "notificacion", ["animal_id"])


def downgrade() -> None:
    op.drop_index("ix_notificacion_animal_id", table_name="notificacion")
    op.drop_table("notificacion")
