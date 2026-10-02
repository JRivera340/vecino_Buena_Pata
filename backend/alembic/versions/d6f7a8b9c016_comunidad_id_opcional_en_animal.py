"""comunidad_id opcional en animal

Revision ID: d6f7a8b9c016
Revises: c5e6f7a8b905
Create Date: 2026-10-02 10:00:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d6f7a8b9c016"
down_revision: Union[str, None] = "c5e6f7a8b905"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("animal", "comunidad_id", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column("animal", "comunidad_id", existing_type=sa.Integer(), nullable=False)
