"""
SQLAlchemy models for the database
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from ..models import (
    HardinessMap,
    Plant,
    Sensor,
    SensorReading,
    Species,
    SpeciesDetailsResponse,
    SpeciesGuideData,
    Subscription,
    WateringEvent,
)
from .setup import Base


class PlantDB(Base):
    """Database model for plants"""

    __tablename__ = "plants"
    __table_args__ = (
        Index("ix_plants_perenual_species_id", "perenual_species_id"),
        Index("ix_plants_last_watered", "last_watered"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )
    name: Mapped[str] = mapped_column(Text())
    species: Mapped[str] = mapped_column(Text())
    species_username: Mapped[str | None] = mapped_column(Text(), nullable=True)
    watering_interval: Mapped[int] = mapped_column(Integer())
    last_watered: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    image: Mapped[bytes | None] = mapped_column(LargeBinary(), nullable=True)
    thumbnail: Mapped[bytes | None] = mapped_column(LargeBinary(), nullable=True)
    perenual_species_id: Mapped[int | None] = mapped_column(
        Integer(),
        ForeignKey("plant_species.perenual_id", ondelete="SET NULL"),
        nullable=True,
    )

    @classmethod
    def from_model(cls, plant: Plant) -> "PlantDB":
        """Convert from Pydantic model to SQLAlchemy model"""
        return cls(
            id=plant.id,
            created_at=plant.created_at,
            updated_at=plant.updated_at,
            name=plant.name,
            species_username=plant.species_username,
            species=plant.species,
            watering_interval=plant.watering_interval,
            last_watered=plant.last_watered,
            image=plant.image,
            thumbnail=getattr(plant, "thumbnail", None),
            perenual_species_id=plant.perenual_species_id,
        )

    def to_model(self) -> Plant:
        """Convert to Pydantic model"""
        return Plant(
            id=self.id,
            created_at=self.created_at,
            updated_at=self.updated_at,
            name=self.name,
            species_username=self.species_username,
            species=self.species,
            watering_interval=self.watering_interval,
            last_watered=self.last_watered,
            image=self.image,
            perenual_species_id=self.perenual_species_id,
        )


class HardinessMapDB(Base):
    """Database model for hardiness maps"""

    __tablename__ = "hardiness_maps"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    image: Mapped[bytes] = mapped_column(LargeBinary())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    @classmethod
    def from_model(cls, hardiness_map: HardinessMap) -> "HardinessMapDB":
        return cls(
            id=hardiness_map.id,
            image=hardiness_map.image,
            created_at=hardiness_map.created_at,
            updated_at=hardiness_map.updated_at,
        )

    def to_model(self) -> HardinessMap:
        return HardinessMap(
            id=self.id,
            image=self.image,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )


class SpeciesDB(Base):
    """Database model for species information."""

    __tablename__ = "plant_species"

    perenual_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )
    details: Mapped[dict] = mapped_column(JSON())
    care_guides: Mapped[dict] = mapped_column(JSON())

    @classmethod
    def from_model(cls, species: Species) -> "SpeciesDB":
        return cls(
            perenual_id=species.perenual_id,
            created_at=species.created_at,
            updated_at=species.updated_at,
            details=species.details.model_dump(),
            care_guides=species.care_guides.model_dump()
            if species.care_guides
            else None,
        )

    def to_model(self) -> Species:
        return Species(
            perenual_id=self.perenual_id,
            created_at=self.created_at,
            updated_at=self.updated_at,
            details=SpeciesDetailsResponse.model_validate(self.details),
            care_guides=SpeciesGuideData.model_validate(self.care_guides)
            if self.care_guides
            else None,
        )


class SubscriptionDB(Base):
    """Database model for subscriptions"""

    __tablename__ = "subscriptions"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )
    name: Mapped[str] = mapped_column(Text())
    email: Mapped[str] = mapped_column(Text(), unique=True)

    @classmethod
    def from_model(cls, subscription: Subscription) -> "SubscriptionDB":
        """Convert from Pydantic model to SQLAlchemy model"""
        return cls(
            id=subscription.id,
            created_at=subscription.created_at,
            updated_at=subscription.updated_at,
            name=subscription.name,
            email=subscription.email,
        )

    def to_model(self) -> Subscription:
        """Convert to Pydantic model"""
        return Subscription(
            id=self.id,
            created_at=self.created_at,
            updated_at=self.updated_at,
            name=self.name,
            email=self.email,
        )


class SensorDB(Base):
    """Tracks registered sensors; last_seen_at updated on each registration and moisture POST"""

    __tablename__ = "sensors"

    sensor_id: Mapped[str] = mapped_column(Text(), primary_key=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    adc_dry: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    adc_wet: Mapped[int | None] = mapped_column(Integer(), nullable=True)

    def to_model(self) -> Sensor:
        return Sensor(
            sensor_id=self.sensor_id,
            registered_at=self.registered_at,
            last_seen_at=self.last_seen_at,
            adc_dry=self.adc_dry,
            adc_wet=self.adc_wet,
        )


class PlantSensorAssignmentDB(Base):
    """Maps a sensor to a plant; UNIQUE on sensor_id so a sensor belongs to at most one plant"""

    __tablename__ = "plant_sensor_assignments"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    plant_id: Mapped[UUID] = mapped_column(
        ForeignKey("plants.id", ondelete="CASCADE"), nullable=False
    )
    sensor_id: Mapped[str] = mapped_column(
        Text(),
        ForeignKey("sensors.sensor_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SensorReadingDB(Base):
    """Historical moisture readings linked to a plant at the time of reading"""

    __tablename__ = "sensor_readings"
    __table_args__ = (
        Index("ix_sensor_readings_plant_recorded", "plant_id", "recorded_at"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True)
    plant_id: Mapped[UUID] = mapped_column(
        ForeignKey("plants.id", ondelete="CASCADE"), nullable=False
    )
    # sensor_id is stored for reference but not a FK; readings are kept even after a sensor goes inactive
    sensor_id: Mapped[str] = mapped_column(Text(), nullable=False)
    level: Mapped[float] = mapped_column(Float(), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    def to_model(self) -> SensorReading:
        return SensorReading(
            id=self.id,
            plant_id=self.plant_id,
            sensor_id=self.sensor_id,
            level=self.level,
            recorded_at=self.recorded_at,
        )


class WateringEventDB(Base):
    """Historical record of each time a plant was watered"""

    __tablename__ = "watering_events"
    __table_args__ = (
        Index("ix_watering_events_plant_watered", "plant_id", "watered_at"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True)
    plant_id: Mapped[UUID] = mapped_column(
        ForeignKey("plants.id", ondelete="CASCADE"), nullable=False
    )
    watered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    def to_model(self) -> WateringEvent:
        return WateringEvent(
            id=self.id,
            plant_id=self.plant_id,
            watered_at=self.watered_at,
        )
