"""add adc_dry and adc_wet calibration columns to sensors

Revision ID: 0005_sensor_calibration
Revises: 0004_sensor_history_tables
Create Date: 2026-06-02 00:00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_sensor_calibration"
down_revision: str | Sequence[str] | None = "0004_sensor_history_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("sensors", sa.Column("adc_dry", sa.Integer(), nullable=True))
    op.add_column("sensors", sa.Column("adc_wet", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("sensors", "adc_wet")
    op.drop_column("sensors", "adc_dry")
