"""comportamiento inicial del animal

Revision ID: a3c4d5e6f703
Revises: f2b3c4d5e602
Create Date: 2026-09-30 09:20:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a3c4d5e6f703"
down_revision: Union[str, None] = "f2b3c4d5e602"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("animal", sa.Column("observacion_comportamiento", sa.String(1000), nullable=True))


def downgrade() -> None:
    op.drop_column("animal", "observacion_comportamiento")
