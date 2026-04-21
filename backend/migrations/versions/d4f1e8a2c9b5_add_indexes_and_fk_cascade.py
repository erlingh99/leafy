"""add indexes and fk on delete set null

Revision ID: d4f1e8a2c9b5
Revises: c8e2f1a9b3d7
Create Date: 2026-04-20 00:00:00

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'd4f1e8a2c9b5'
down_revision: Union[str, Sequence[str], None] = 'c8e2f1a9b3d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_plants_perenual_species_id", "plants", ["perenual_species_id"])
    op.create_index("ix_plants_last_watered", "plants", ["last_watered"])

    # Recreate the plants table with ON DELETE SET NULL on the FK
    with op.batch_alter_table("plants", schema=None) as batch_op:
        batch_op.drop_constraint("plants_perenual_species_id_fkey", type_="foreignkey")
        batch_op.create_foreign_key(
            "plants_perenual_species_id_fkey",
            "plant_species",
            ["perenual_species_id"],
            ["perenual_id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("plants", schema=None) as batch_op:
        batch_op.drop_constraint("plants_perenual_species_id_fkey", type_="foreignkey")
        batch_op.create_foreign_key(
            "plants_perenual_species_id_fkey",
            "plant_species",
            ["perenual_species_id"],
            ["perenual_id"],
        )

    op.drop_index("ix_plants_last_watered", table_name="plants")
    op.drop_index("ix_plants_perenual_species_id", table_name="plants")
