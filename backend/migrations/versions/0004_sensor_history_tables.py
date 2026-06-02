"""add sensors, sensor_readings, watering_events tables; move sensor fields off plants

Revision ID: 0004_sensor_history_tables
Revises: 0003_add_sensor_and_moisture_fields
Create Date: 2026-05-13 00:00:00

"""

from typing import Sequence, Union
from uuid import uuid4
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa

revision: str = "0004_sensor_history_tables"
down_revision: Union[str, Sequence[str], None] = "0003_add_sensor_and_moisture_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sensors",
        sa.Column("sensor_id", sa.Text(), primary_key=True, nullable=False),
        sa.Column("registered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "plant_sensor_assignments",
        sa.Column("id", sa.Text(), primary_key=True, nullable=False),
        sa.Column(
            "plant_id",
            sa.Text(),
            sa.ForeignKey("plants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sensor_id",
            sa.Text(),
            sa.ForeignKey("sensors.sensor_id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "sensor_readings",
        sa.Column("id", sa.Text(), primary_key=True, nullable=False),
        sa.Column(
            "plant_id",
            sa.Text(),
            sa.ForeignKey("plants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sensor_id", sa.Text(), nullable=False),
        sa.Column("level", sa.Float(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_sensor_readings_plant_recorded",
        "sensor_readings",
        ["plant_id", "recorded_at"],
    )

    op.create_table(
        "watering_events",
        sa.Column("id", sa.Text(), primary_key=True, nullable=False),
        sa.Column(
            "plant_id",
            sa.Text(),
            sa.ForeignKey("plants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("watered_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_watering_events_plant_watered",
        "watering_events",
        ["plant_id", "watered_at"],
    )

    # Migrate existing sensor data from plants table
    conn = op.get_bind()
    now = datetime.now(timezone.utc).isoformat()

    plants = conn.execute(
        sa.text(
            "SELECT id, sensor_id, moisture_level, moisture_updated_at FROM plants "
            "WHERE sensor_id IS NOT NULL"
        )
    ).fetchall()

    for row in plants:
        plant_id, sensor_id, moisture_level, moisture_updated_at = row

        conn.execute(
            sa.text(
                "INSERT OR IGNORE INTO sensors (sensor_id, registered_at, last_seen_at) "
                "VALUES (:sid, :now, :now)"
            ),
            {"sid": sensor_id, "now": now},
        )

        conn.execute(
            sa.text(
                "INSERT INTO plant_sensor_assignments (id, plant_id, sensor_id, assigned_at) "
                "VALUES (:id, :plant_id, :sensor_id, :now)"
            ),
            {
                "id": str(uuid4()),
                "plant_id": str(plant_id),
                "sensor_id": sensor_id,
                "now": now,
            },
        )

        if moisture_level is not None and moisture_updated_at is not None:
            conn.execute(
                sa.text(
                    "INSERT INTO sensor_readings (id, plant_id, sensor_id, level, recorded_at) "
                    "VALUES (:id, :plant_id, :sensor_id, :level, :recorded_at)"
                ),
                {
                    "id": str(uuid4()),
                    "plant_id": str(plant_id),
                    "sensor_id": sensor_id,
                    "level": float(moisture_level),
                    "recorded_at": str(moisture_updated_at),
                },
            )

    # Remove sensor columns from plants table (batch required for SQLite)
    with op.batch_alter_table("plants") as batch_op:
        batch_op.drop_index("ix_plants_sensor_id")
        batch_op.drop_column("moisture_updated_at")
        batch_op.drop_column("moisture_level")
        batch_op.drop_column("sensor_id")


def downgrade() -> None:
    op.drop_index("ix_watering_events_plant_watered", table_name="watering_events")
    op.drop_table("watering_events")
    op.drop_index("ix_sensor_readings_plant_recorded", table_name="sensor_readings")
    op.drop_table("sensor_readings")
    op.drop_table("plant_sensor_assignments")
    op.drop_table("sensors")

    with op.batch_alter_table("plants") as batch_op:
        batch_op.add_column(sa.Column("sensor_id", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("moisture_level", sa.Float(), nullable=True))
        batch_op.add_column(
            sa.Column("moisture_updated_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.create_index("ix_plants_sensor_id", ["sensor_id"], unique=True)
