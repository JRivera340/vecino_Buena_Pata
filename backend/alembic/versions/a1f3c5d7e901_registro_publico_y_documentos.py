"""registro publico y documentos

Revision ID: a1f3c5d7e901
Revises: 54900f899b88
Create Date: 2026-09-26 10:00:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1f3c5d7e901"
down_revision: Union[str, None] = "54900f899b88"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TIPOS_DOCUMENTO = ("CC", "CE", "NIT", "OTRO")


def _tipo_documento(**kwargs) -> postgresql.ENUM:
    return postgresql.ENUM(*TIPOS_DOCUMENTO, name="tipodocumentoenum", **kwargs)


def upgrade() -> None:
    _tipo_documento().create(op.get_bind(), checkfirst=True)

    op.create_table(
        "persona",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tipo_documento", _tipo_documento(create_type=False), nullable=False),
        sa.Column("numero_documento", sa.String(30), nullable=False),
        sa.Column("nombre", sa.String(160), nullable=False),
        sa.Column("telefono", sa.String(30), nullable=False),
        sa.Column("correo", sa.String(160), nullable=False),
        sa.Column("barrio", sa.String(120), nullable=False),
        sa.Column("aceptacion_datos_en", sa.DateTime(timezone=True), nullable=False),
        sa.Column("creada_en", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tipo_documento", "numero_documento", name="uq_persona_documento"),
    )

    op.create_table(
        "limite_peticion",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("clave", sa.String(160), nullable=False),
        sa.Column("creada_en", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_limite_peticion_clave_creada", "limite_peticion", ["clave", "creada_en"])

    op.add_column("usuario", sa.Column("tipo_documento", _tipo_documento(create_type=False), nullable=True))
    op.add_column("usuario", sa.Column("numero_documento", sa.String(30), nullable=True))
    op.create_unique_constraint("uq_usuario_documento", "usuario", ["tipo_documento", "numero_documento"])

    op.add_column("comunidad", sa.Column("lider_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_comunidad_lider", "comunidad", "usuario", ["lider_id"], ["id"])

    op.add_column("animal", sa.Column("persona_id", sa.Integer(), nullable=True))
    op.add_column("animal", sa.Column("posible_duplicado_de_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_animal_persona", "animal", "persona", ["persona_id"], ["id"])
    op.create_foreign_key("fk_animal_duplicado", "animal", "animal", ["posible_duplicado_de_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_animal_duplicado", "animal", type_="foreignkey")
    op.drop_constraint("fk_animal_persona", "animal", type_="foreignkey")
    op.drop_column("animal", "posible_duplicado_de_id")
    op.drop_column("animal", "persona_id")

    op.drop_constraint("fk_comunidad_lider", "comunidad", type_="foreignkey")
    op.drop_column("comunidad", "lider_id")

    op.drop_constraint("uq_usuario_documento", "usuario", type_="unique")
    op.drop_column("usuario", "numero_documento")
    op.drop_column("usuario", "tipo_documento")

    op.drop_index("ix_limite_peticion_clave_creada", table_name="limite_peticion")
    op.drop_table("limite_peticion")
    op.drop_table("persona")

    _tipo_documento().drop(op.get_bind(), checkfirst=True)
