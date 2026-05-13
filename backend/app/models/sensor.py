from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, computed_field


class Sensor(BaseModel):
    sensor_id: str
    registered_at: datetime
    last_seen_at: datetime

    @computed_field
    @property
    def is_active(self) -> bool:
        delta = datetime.now(timezone.utc) - self.last_seen_at.replace(tzinfo=timezone.utc) if self.last_seen_at.tzinfo is None else datetime.now(timezone.utc) - self.last_seen_at
        return delta.total_seconds() < 86400


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
