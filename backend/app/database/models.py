"""
SQLAlchemy models for the database
"""
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text, func, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column

from .setup import Base
from ..models import Plant, Species, Subscription, SpeciesDetailsResponse, SpeciesGuideData, HardinessMap

class PlantDB(Base):
    """Database model for plants"""
    __tablename__ = "plants"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now()
    )
    name: Mapped[str] = mapped_column(Text())
    species: Mapped[str] = mapped_column(Text())
    watering_interval: Mapped[int] = mapped_column(Integer())
    last_watered: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    image: Mapped[bytes] = mapped_column(LargeBinary())
    perenual_species_id: Mapped[int | None] = mapped_column(
        Integer(), ForeignKey("plant_species.perenual_id"), nullable=True
    )


    @classmethod
    def from_model(cls, plant: Plant) -> "PlantDB":
        """Convert from Pydantic model to SQLAlchemy model"""
        return cls(
            id=plant.id,
            created_at=plant.created_at,
            updated_at=plant.updated_at,
            name=plant.name,
            species=plant.species,
            watering_interval=plant.watering_interval,
            last_watered=plant.last_watered,
            image=plant.image,
            perenual_species_id=plant.perenual_species_id,
        )
    
    def to_model(self) -> Plant:
        """Convert to Pydantic model"""
        return Plant(
            id=self.id,
            created_at=self.created_at,
            updated_at=self.updated_at,
            name=self.name,
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
        DateTime(timezone=True),
        onupdate=func.now()
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
        DateTime(timezone=True),
        onupdate=func.now()
    )
    details: Mapped[dict] = mapped_column(JSON()) #TODO not like this... or?
    care_guides: Mapped[dict] = mapped_column(JSON())

    @classmethod
    def from_model(cls, species: Species) -> "SpeciesDB":
        return cls(
            perenual_id=species.perenual_id,
            created_at=species.created_at,
            updated_at=species.updated_at,
            details=species.details.model_dump(),
            care_guides=species.care_guides.model_dump() if species.care_guides else None,
        )

    def to_model(self) -> Species:
        return Species(
            perenual_id=self.perenual_id,
            created_at=self.created_at,
            updated_at=self.updated_at,
            details=SpeciesDetailsResponse.model_validate(self.details),
            care_guides=SpeciesGuideData.model_validate(self.care_guides) if self.care_guides else None,
        )
    
class SubscriptionDB(Base):
    """Database model for subscriptions"""
    __tablename__ = "subscriptions"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now()
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
            email=subscription.email
        )
    
    def to_model(self) -> Subscription:
        """Convert to Pydantic model"""
        return Subscription(
            id=self.id,
            created_at=self.created_at,
            updated_at=self.updated_at,
            name=self.name,
            email=self.email
        )
