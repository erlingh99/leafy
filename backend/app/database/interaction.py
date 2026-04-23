"""
SQLite storage backend for plants
"""
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Plant, Species, Subscription, HardinessMap
from .models import PlantDB, SpeciesDB, SubscriptionDB, HardinessMapDB


async def load_plants(db: AsyncSession) -> dict[UUID, Plant]:
    """Load plants from the database."""
    result = await db.execute(select(PlantDB))
    plants = result.scalars().all()
    return {plant.id: plant.to_model() for plant in plants}


async def load_plants_without_images(db: AsyncSession) -> list[dict]:
    """Load lightweight plant rows without image/thumbnail binary columns.

    Returns a list of dicts with plant metadata and boolean flags indicating
    whether an image/thumbnail exists.
    """
    stmt = select(
        PlantDB.id,
        PlantDB.created_at,
        PlantDB.updated_at,
        PlantDB.name,
        PlantDB.species_username,
        PlantDB.species,
        PlantDB.watering_interval,
        PlantDB.last_watered,
        PlantDB.perenual_species_id,
        PlantDB.image.isnot(None).label("has_image"),
        PlantDB.thumbnail.isnot(None).label("has_thumbnail"),
    )
    result = await db.execute(stmt)
    rows = result.all()
    plants: list[dict] = []
    for row in rows:
        plants.append({
            "id": row.id,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "name": row.name,
            "species_username": row.species_username,
            "species": row.species,
            "watering_interval": row.watering_interval,
            "last_watered": row.last_watered,
            "perenual_species_id": row.perenual_species_id,
            "has_image": bool(row.has_image),
            "has_thumbnail": bool(row.has_thumbnail),
        })
    return plants


async def save_plant(db: AsyncSession, plant: Plant, thumbnail: bytes | None = None) -> None:
    """Save a single plant to the database.

    Accepts an optional `thumbnail` bytes value which will be stored in the
    `thumbnail` column.
    """
    db_plant = PlantDB.from_model(plant)
    if thumbnail is not None:
        db_plant.thumbnail = thumbnail
    db.add(db_plant)


async def update_plant(
    db: AsyncSession,
    plant: Plant,
    thumbnail: bytes | None = None,
    *,
    set_thumbnail: bool = False,
) -> None:
    """Update a single plant in the database.

    Pass `thumbnail=None, set_thumbnail=True` to clear the thumbnail column.
    Pass `thumbnail=<bytes>, set_thumbnail=True` to update it.
    Omit `set_thumbnail` (default False) to leave the existing value untouched.
    """
    db_plant = PlantDB.from_model(plant)
    values = {
        "name": db_plant.name,
        "updated_at": db_plant.updated_at,
        "species": db_plant.species,
        "species_username": db_plant.species_username,
        "watering_interval": db_plant.watering_interval,
        "last_watered": db_plant.last_watered,
        "image": db_plant.image,
        "perenual_species_id": db_plant.perenual_species_id,
    }
    if set_thumbnail:
        values["thumbnail"] = thumbnail

    await db.execute(
        update(PlantDB).where(PlantDB.id == db_plant.id).values(**values)
    )

async def water_all_plants(db: AsyncSession) -> None:
    await db.execute(
        update(PlantDB)
        .values(
            last_watered=datetime.now(timezone.utc)
        )
    )
    
async def water_plant(db: AsyncSession, plant_id: UUID) -> bool:
    stmt = (
        update(PlantDB)
        .where(PlantDB.id == plant_id)
        .values(last_watered=datetime.now(timezone.utc))
        .returning(PlantDB.id)
    )
    result = await db.execute(stmt)
    updated_id = result.scalar_one_or_none()
    return updated_id is not None



async def delete_plant(db: AsyncSession, plant_id: UUID) -> None:
    """Delete a plant from the database."""
    await db.execute(delete(PlantDB).filter(PlantDB.id == plant_id))


async def get_plant(db: AsyncSession, plant_id: UUID) -> Plant | None:
    """Retrieve a single plant by id."""
    db_plant = await db.get(PlantDB, plant_id)
    if db_plant is None:
        return None
    return db_plant.to_model()


async def get_plant_image(db: AsyncSession, plant_id: UUID) -> bytes | None:
    """Fetch only the image column for a plant (data URI bytes stored).

    Returns raw bytes (data URI) or None.
    """
    stmt = select(PlantDB.image).where(PlantDB.id == plant_id)
    result = await db.execute(stmt)
    image = result.scalar_one_or_none()
    return image


async def get_plant_thumbnail(db: AsyncSession, plant_id: UUID) -> bytes | None:
    """Fetch only the thumbnail column for a plant (raw JPEG bytes).

    Returns bytes or None.
    """
    stmt = select(PlantDB.thumbnail).where(PlantDB.id == plant_id)
    result = await db.execute(stmt)
    thumbnail = result.scalar_one_or_none()
    return thumbnail


async def has_plant_thumbnail(db: AsyncSession, plant_id: UUID) -> bool:
    """Return True if a plant has a thumbnail without loading the blob."""
    stmt = select(PlantDB.id).where(PlantDB.id == plant_id, PlantDB.thumbnail.isnot(None)).limit(1)
    result = await db.execute(stmt)
    found = result.scalar_one_or_none()
    return found is not None


async def get_species(db: AsyncSession, perenual_id: int) -> Species | None:
    """Retrieve species metadata by Perenual id."""
    db_species = await db.get(SpeciesDB, perenual_id)
    if db_species is None:
        return None
    return db_species.to_model()


async def upsert_species(db: AsyncSession, species: Species) -> None:
    """Insert or update species metadata."""
    existing = await db.get(SpeciesDB, species.perenual_id)
    if existing:
        existing.details = species.details.model_dump()
        existing.updated_at = species.updated_at
        if species.care_guides:
            existing.care_guides = species.care_guides.model_dump()
    else:
        db_species = SpeciesDB.from_model(species)
        db.add(db_species)


async def load_subscriptions(db: AsyncSession) -> dict[UUID, Subscription]:
    """Load subscriptions from the database."""
    result = await db.execute(select(SubscriptionDB))
    subscriptions = result.scalars().all()
    return {subscription.id: subscription.to_model() for subscription in subscriptions}


async def save_subscription(db: AsyncSession, subscription: Subscription) -> None:
    """Save a single subscription to the database."""
    db_subscription = SubscriptionDB.from_model(subscription)
    db.add(db_subscription)


async def update_subscription(db: AsyncSession, subscription: Subscription) -> None:
    """Update a single subscription in the database."""
    db_subscription = SubscriptionDB.from_model(subscription)
    await db.execute(
        update(SubscriptionDB)
        .where(SubscriptionDB.id == db_subscription.id)
        .values(
            name=db_subscription.name,
            email=db_subscription.email,
            updated_at=db_subscription.updated_at,
        )
    )


async def delete_subscription(db: AsyncSession, subscription_id: UUID) -> None:
    """Delete a subscription from the database."""
    await db.execute(delete(SubscriptionDB).filter(SubscriptionDB.id == subscription_id))


async def get_hardiness_map(db: AsyncSession, id: int) -> HardinessMap | None:
    """Retrieve a hardiness map by id."""
    db_hardiness_map = await db.get(HardinessMapDB, id)
    if db_hardiness_map is None:
        return None
    return db_hardiness_map.to_model()


async def get_hardiness_maps_batch(db: AsyncSession, ids: list[int]) -> dict[int, HardinessMap]:
    """Fetch multiple hardiness maps in a single query."""
    stmt = select(HardinessMapDB).where(HardinessMapDB.id.in_(ids))
    result = await db.execute(stmt)
    return {m.id: m.to_model() for m in result.scalars()}


async def save_hardiness_map(db: AsyncSession, hardiness_map: HardinessMap) -> None:
    """Save a hardiness map to the database."""
    db_hardiness_map = HardinessMapDB.from_model(hardiness_map)
    db.add(db_hardiness_map)
