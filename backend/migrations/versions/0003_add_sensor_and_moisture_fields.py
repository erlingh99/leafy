"""add sensor_id and moisture fields to plants

Revision ID: 0003_add_sensor_and_moisture_fields
Revises: 0002_resize_thumbnails_128
Create Date: 2026-05-07 00:00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_add_sensor_and_moisture_fields"
down_revision: str | Sequence[str] | None = "0002_resize_thumbnails_128"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("plants") as batch_op:
        batch_op.add_column(sa.Column("sensor_id", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("moisture_level", sa.Float(), nullable=True))
        batch_op.add_column(
            sa.Column("moisture_updated_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.create_index("ix_plants_sensor_id", ["sensor_id"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("plants") as batch_op:
        batch_op.drop_index("ix_plants_sensor_id")
        batch_op.drop_column("moisture_updated_at")
        batch_op.drop_column("moisture_level")
        batch_op.drop_column("sensor_id")
