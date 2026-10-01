"""agrega rol unidad especial

Revision ID: e1a2b3c4d501
Revises: d4e6f8a0b234
Create Date: 2026-09-30 09:00:00
"""
from typing import Sequence, Union

from alembic import op

revision: str = "e1a2b3c4d501"
down_revision: Union[str, None] = "d4e6f8a0b234"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE rolusuarioenum ADD VALUE IF NOT EXISTS 'UNIDAD_ESPECIAL'")


def downgrade() -> None:
    # Postgres no permite quitar un valor de un enum sin recrear el tipo.
    # Si hay que revertir, se recrea el tipo a mano (igual que hizo c3d5e7f9a123).
    pass
