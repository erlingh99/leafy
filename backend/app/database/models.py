"""
SQLAlchemy models for the database
"""
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, func, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column

from .setup import Base
from ..models import Plant, Subscription

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
    image: Mapped[bytes] = mapped_column(Text())


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
            image=plant.image
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
            image=self.image
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
