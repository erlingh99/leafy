"""
SQLite storage backend for plants
"""
from typing import Dict
from uuid import UUID

from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Plant, Subscription
from . import PlantDB, SubscriptionDB

async def load_plants(db: AsyncSession) -> Dict[UUID, Plant]:
    """Load plants from the database."""
    result = await db.execute(select(PlantDB))
    plants = result.scalars().all()
    return {plant.id: plant.to_model() for plant in plants}

async def save_plant(db: AsyncSession, plant: Plant) -> None:
    """Save a single plant to the database."""
    db_plant = PlantDB.from_model(plant)
    db.add(db_plant)
    await db.commit()

async def update_plant(db: AsyncSession, plant: Plant) -> None:
    """Update a single plant in the database."""
    db_plant = PlantDB.from_model(plant)
    await db.execute(
        update(PlantDB)
        .where(PlantDB.id == db_plant.id)
        .values(
            name=db_plant.name,
            updated_at=db_plant.updated_at,
            species=db_plant.species,
            watering_interval=db_plant.watering_interval,
            last_watered=db_plant.last_watered,
            image=db_plant.image
        )
    )
    await db.commit()

async def delete_plant(db: AsyncSession, plant_id: UUID) -> None:
    """Delete a plant from the database."""
    await db.execute(delete(PlantDB).filter(PlantDB.id == plant_id))
    await db.commit()


async def load_subscriptions(db: AsyncSession) -> Dict[UUID, Subscription]:
    """Load subscriptions from the database."""
    result = await db.execute(select(SubscriptionDB))
    subscriptions = result.scalars().all()
    return {subscription.id: subscription.to_model() for subscription in subscriptions}

async def save_subscription(db: AsyncSession, subscription: Subscription) -> None:
    """Save a single subscription to the database."""
    db_subscription = SubscriptionDB.from_model(subscription)
    db.add(db_subscription)
    await db.commit()

async def update_subscription(db: AsyncSession, subscription: Subscription) -> None:
    """Update a single subscription in the database."""
    db_subscription = SubscriptionDB.from_model(subscription)
    await db.execute(
        update(SubscriptionDB)
        .where(SubscriptionDB.id == db_subscription.id)
        .values(
            name=db_subscription.name,
            email=db_subscription.email,
            updated_at=db_subscription.updated_at
        )
    )
    await db.commit()

async def delete_subscription(db: AsyncSession, subscription_id: UUID) -> None:
    """Delete a subscription from the database."""
    await db.execute(delete(SubscriptionDB).filter(SubscriptionDB.id == subscription_id))
    await db.commit()
