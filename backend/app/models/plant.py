from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID, uuid4

class Plant(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.now) # ISO formatted string
    updated_at: datetime = Field(default_factory=datetime.now) # ISO formatted string
    name: str
    species: str
    watering_interval: int
    last_watered: datetime
    image: bytes


class PlantUpdate(BaseModel):
    name: str | None = None
    species: str | None = None
    watering_interval: int | None = None
    last_watered: datetime | None = None
    image: bytes | None = None
