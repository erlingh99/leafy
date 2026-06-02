from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, computed_field


class Sensor(BaseModel):
    sensor_id: str
    registered_at: datetime
    last_seen_at: datetime
    adc_dry: int | None = None
    adc_wet: int | None = None

    @computed_field
    @property
    def is_active(self) -> bool:
        last_seen = (
            self.last_seen_at
            if self.last_seen_at.tzinfo is not None
            else self.last_seen_at.replace(tzinfo=timezone.utc)
        )
        return (datetime.now(timezone.utc) - last_seen).total_seconds() < 24 * 60 * 60


class SensorAssignment(BaseModel):
    id: UUID
    plant_id: UUID
    plant_name: str
    sensor_id: str
    assigned_at: datetime


class SensorReading(BaseModel):
    id: UUID
    plant_id: UUID
    sensor_id: str
    level: float
    recorded_at: datetime


class WateringEvent(BaseModel):
    id: UUID
    plant_id: UUID
    watered_at: datetime
