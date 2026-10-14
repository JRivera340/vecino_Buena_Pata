"""agrega causal de salida OTRO

Revision ID: e7a8b9c0d127
Revises: d6f7a8b9c016
Create Date: 2026-10-14 09:00:00
"""
from typing import Sequence, Union

from alembic import op

revision: str = "e7a8b9c0d127"
down_revision: Union[str, None] = "d6f7a8b9c016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE causalsalidaenum ADD VALUE IF NOT EXISTS 'OTRO'")


def downgrade() -> None:
    # Postgres no permite quitar un valor de un enum sin recrear el tipo.
    pass
