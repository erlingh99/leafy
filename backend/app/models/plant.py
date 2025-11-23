from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Plant(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.now)  # ISO formatted string
    updated_at: datetime = Field(default_factory=datetime.now)  # ISO formatted string
    name: str
    species_username: str | None = None
    species: str
    watering_interval: int
    last_watered: datetime
    image: bytes
    perenual_species_id: int | None = None


class PlantUpdate(BaseModel):
    name: str | None = None
    species: str | None = None
    species_username: str | None = None
    watering_interval: int | None = None
    last_watered: datetime | None = None
    image: bytes | None = None
    perenual_species_id: int | None = None
