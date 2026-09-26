"""localidad del animal

Revision ID: d4e6f8a0b234
Revises: c3d5e7f9a123
Create Date: 2026-09-26 16:00:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e6f8a0b234"
down_revision: Union[str, None] = "c3d5e7f9a123"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("animal", sa.Column("localidad", sa.String(60), nullable=True))

    # Calcula la localidad de los animales que ya existen a partir de sus coordenadas.
    from app.services.localidades import cargar_localidades, localidad_de_punto

    localidades = cargar_localidades()
    conexion = op.get_bind()
    animales = conexion.execute(sa.text("SELECT id, latitud, longitud FROM animal")).fetchall()
    for animal_id, latitud, longitud in animales:
        nombre = localidad_de_punto(latitud, longitud, localidades)
        if nombre is not None:
            conexion.execute(
                sa.text("UPDATE animal SET localidad = :nombre WHERE id = :id"), {"nombre": nombre, "id": animal_id}
            )


def downgrade() -> None:
    op.drop_column("animal", "localidad")
