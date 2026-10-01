"""reclamo de visita de seguimiento

Revision ID: b4d5e6f7a804
Revises: a3c4d5e6f703
Create Date: 2026-09-30 09:30:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4d5e6f7a804"
down_revision: Union[str, None] = "a3c4d5e6f703"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("animal", sa.Column("visita_en_camino_por", sa.String(120), nullable=True))
    op.add_column("animal", sa.Column("visita_en_camino_desde", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("animal", "visita_en_camino_desde")
    op.drop_column("animal", "visita_en_camino_por")
