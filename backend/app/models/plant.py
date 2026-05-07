from datetime import datetime, timezone
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Plant(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    name: str
    species_username: str | None = None
    species: str
    watering_interval: int = Field(gt=0, le=365)
    last_watered: datetime
    image: bytes | None = None
    perenual_species_id: int | None = None
    sensor_id: str | None = None
    moisture_level: float | None = None
    moisture_updated_at: datetime | None = None


class PlantUpdate(BaseModel):
    name: str | None = None
    species: str | None = None
    species_username: str | None = None
    watering_interval: int | None = Field(default=None, gt=0, le=365)
    last_watered: datetime | None = None
    image: bytes | None = None
    perenual_species_id: int | None = None
    sensor_id: str | None = None


class PlantResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    name: str
    species_username: str | None = None
    species: str
    watering_interval: int
    last_watered: datetime
    # URLs to fetch image/thumbnail from dedicated endpoints (or None)
    image_url: str | None = None
    thumbnail_url: str | None = None
    perenual_species_id: int | None = None
    sensor_id: str | None = None
    moisture_level: float | None = None
    moisture_updated_at: datetime | None = None
