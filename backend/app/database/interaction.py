"""
SQLite storage backend for plants
"""

from datetime import UTC, datetime, timedelta
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import (
    HardinessMap,
    Plant,
    Sensor,
    SensorAssignment,
    SensorReading,
    Species,
    Subscription,
    WateringEvent,
)
from .models import (
    HardinessMapDB,
    PlantDB,
    PlantSensorAssignmentDB,
    SensorDB,
    SensorReadingDB,
    SpeciesDB,
    SubscriptionDB,
    WateringEventDB,
)


class WaterResult(str, Enum):
    WATERED = "watered"
    DEBOUNCED = "debounced"
    NOT_FOUND = "not_found"


async def load_plants(db: AsyncSession) -> dict[UUID, Plant]:
    """Load plants from the database."""
    result = await db.execute(select(PlantDB))
    plants = result.scalars().all()
    return {plant.id: plant.to_model() for plant in plants}


async def load_plants_without_images(db: AsyncSession) -> list[dict]:
    """Load lightweight plant rows without image/thumbnail binary columns.

    Returns a list of dicts with plant metadata, boolean flags for image presence,
    and the latest sensor/moisture data joined from the sensor tables.
    """
    sensor_id_subq = (
        select(PlantSensorAssignmentDB.sensor_id)
        .where(PlantSensorAssignmentDB.plant_id == PlantDB.id)
        .limit(1)
        .correlate(PlantDB)
        .scalar_subquery()
    )
    moisture_level_subq = (
        select(SensorReadingDB.level)
        .where(SensorReadingDB.plant_id == PlantDB.id)
        .order_by(SensorReadingDB.recorded_at.desc())
        .limit(1)
        .correlate(PlantDB)
        .scalar_subquery()
    )
    moisture_at_subq = (
        select(SensorReadingDB.recorded_at)
        .where(SensorReadingDB.plant_id == PlantDB.id)
        .order_by(SensorReadingDB.recorded_at.desc())
        .limit(1)
        .correlate(PlantDB)
        .scalar_subquery()
    )

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
        sensor_id_subq.label("sensor_id"),
        moisture_level_subq.label("moisture_level"),
        moisture_at_subq.label("moisture_updated_at"),
        PlantDB.image.isnot(None).label("has_image"),
        PlantDB.thumbnail.isnot(None).label("has_thumbnail"),
    )
    result = await db.execute(stmt)
    rows = result.all()
    plants: list[dict] = []
    for row in rows:
        plants.append(
            {
                "id": row.id,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
                "name": row.name,
                "species_username": row.species_username,
                "species": row.species,
                "watering_interval": row.watering_interval,
                "last_watered": row.last_watered,
                "perenual_species_id": row.perenual_species_id,
                "sensor_id": row.sensor_id,
                "moisture_level": row.moisture_level,
                "moisture_updated_at": row.moisture_updated_at,
                "has_image": bool(row.has_image),
                "has_thumbnail": bool(row.has_thumbnail),
            }
        )
    return plants


async def get_plant_sensor_data(
    db: AsyncSession, plant_id: UUID
) -> tuple[str | None, float | None, datetime | None]:
    """Return (sensor_id, moisture_level, moisture_updated_at) for a single plant."""
    sensor_result = await db.execute(
        select(PlantSensorAssignmentDB.sensor_id)
        .where(PlantSensorAssignmentDB.plant_id == plant_id)
        .limit(1)
    )
    sensor_id = sensor_result.scalar_one_or_none()

    reading_result = await db.execute(
        select(SensorReadingDB.level, SensorReadingDB.recorded_at)
        .where(SensorReadingDB.plant_id == plant_id)
        .order_by(SensorReadingDB.recorded_at.desc())
        .limit(1)
    )
    reading = reading_result.first()
    moisture_level = reading.level if reading else None
    moisture_updated_at = reading.recorded_at if reading else None

    return sensor_id, moisture_level, moisture_updated_at


async def save_plant(
    db: AsyncSession, plant: Plant, thumbnail: bytes | None = None
) -> None:
    """Save a single plant to the database."""
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
    """Update a single plant in the database."""
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

    await db.execute(update(PlantDB).where(PlantDB.id == db_plant.id).values(**values))


async def water_all_plants(db: AsyncSession, *, debounce_hours: float) -> None:
    now = datetime.now(UTC)
    cutoff = now - timedelta(hours=debounce_hours)

    recent = await db.execute(
        select(WateringEventDB.plant_id)
        .where(WateringEventDB.watered_at >= cutoff)
        .distinct()
    )
    skip_ids = set(recent.scalars().all())

    all_result = await db.execute(select(PlantDB.id))
    plant_ids = [pid for pid in all_result.scalars().all() if pid not in skip_ids]

    if not plant_ids:
        return

    await db.execute(
        update(PlantDB).where(PlantDB.id.in_(plant_ids)).values(last_watered=now)
    )
    db.add_all(
        [WateringEventDB(id=uuid4(), plant_id=pid, watered_at=now) for pid in plant_ids]
    )


async def water_plant(
    db: AsyncSession, plant_id: UUID, *, debounce_hours: float = 4.0
) -> WaterResult:
    now = datetime.now(UTC)

    cutoff = now - timedelta(hours=debounce_hours)
    recent = await db.execute(
        select(WateringEventDB.id)
        .where(
            WateringEventDB.plant_id == plant_id, WateringEventDB.watered_at >= cutoff
        )
        .limit(1)
    )
    if recent.scalar_one_or_none() is not None:
        return WaterResult.DEBOUNCED

    stmt = (
        update(PlantDB)
        .where(PlantDB.id == plant_id)
        .values(last_watered=now)
        .returning(PlantDB.id)
    )
    result = await db.execute(stmt)
    updated_id = result.scalar_one_or_none()
    if updated_id is not None:
        db.add(WateringEventDB(id=uuid4(), plant_id=plant_id, watered_at=now))
        return WaterResult.WATERED
    return WaterResult.NOT_FOUND


async def register_sensor(db: AsyncSession, sensor_id: str) -> Sensor:
    """Upsert a sensor record, updating last_seen_at on re-registration."""
    now = datetime.now(UTC)
    existing = await db.get(SensorDB, sensor_id)
    if existing:
        existing.last_seen_at = now
    else:
        existing = SensorDB(sensor_id=sensor_id, registered_at=now, last_seen_at=now)
        db.add(existing)
    await db.flush()
    return existing.to_model()


async def get_all_sensors(db: AsyncSession) -> list[Sensor]:
    """Return all registered sensors ordered by last_seen_at descending."""
    result = await db.execute(select(SensorDB).order_by(SensorDB.last_seen_at.desc()))
    return [row.to_model() for row in result.scalars().all()]


async def update_sensor_calibration(
    db: AsyncSession, sensor_id: str, adc_dry: int, adc_wet: int
) -> Sensor | None:
    """Persist calibration values for a sensor. Returns updated model or None if not found."""
    sensor = await db.get(SensorDB, sensor_id)
    if sensor is None:
        return None
    sensor.adc_dry = adc_dry
    sensor.adc_wet = adc_wet
    await db.flush()
    return sensor.to_model()


async def record_moisture_reading(
    db: AsyncSession,
    sensor_id: str,
    level: float,
    *,
    auto_water_rise_threshold: float,
    water_debounce_hours: float,
) -> bool:
    """Store a moisture reading and update the sensor's last_seen_at.

    Always updates last_seen_at (auto-registers the sensor if not yet known).
    Inserts a SensorReading only when the sensor is assigned to a plant.
    If the moisture rose by at least auto_water_rise_threshold percentage points
    compared to the previous reading, the plant is automatically marked as watered
    (subject to the debounce guard in water_plant).
    Returns True if a reading was stored, False if unassigned (still 200 to the sensor).
    """
    now = datetime.now(UTC)

    sensor = await db.get(SensorDB, sensor_id)
    if sensor:
        sensor.last_seen_at = now
    else:
        db.add(SensorDB(sensor_id=sensor_id, registered_at=now, last_seen_at=now))

    assignment_result = await db.execute(
        select(PlantSensorAssignmentDB.plant_id)
        .where(PlantSensorAssignmentDB.sensor_id == sensor_id)
        .limit(1)
    )
    plant_id = assignment_result.scalar_one_or_none()
    if plant_id is None:
        return False

    prev_result = await db.execute(
        select(SensorReadingDB.level)
        .where(
            SensorReadingDB.plant_id == plant_id, SensorReadingDB.sensor_id == sensor_id
        )
        .order_by(SensorReadingDB.recorded_at.desc())
        .limit(1)
    )
    prev_level = prev_result.scalar_one_or_none()

    db.add(
        SensorReadingDB(
            id=uuid4(),
            plant_id=plant_id,
            sensor_id=sensor_id,
            level=level,
            recorded_at=now,
        )
    )

    if prev_level is not None and (level - prev_level) >= auto_water_rise_threshold:
        await water_plant(db, plant_id, debounce_hours=water_debounce_hours)

    return True


async def get_sensor_assignments(db: AsyncSession) -> list[SensorAssignment]:
    """Return all sensor-plant assignments with plant name included."""
    stmt = select(
        PlantSensorAssignmentDB.id,
        PlantSensorAssignmentDB.plant_id,
        PlantDB.name.label("plant_name"),
        PlantSensorAssignmentDB.sensor_id,
        PlantSensorAssignmentDB.assigned_at,
    ).join(PlantDB, PlantDB.id == PlantSensorAssignmentDB.plant_id)
    result = await db.execute(stmt)
    return [
        SensorAssignment(
            id=row.id,
            plant_id=row.plant_id,
            plant_name=row.plant_name,
            sensor_id=row.sensor_id,
            assigned_at=row.assigned_at,
        )
        for row in result.all()
    ]


async def upsert_sensor_assignment(
    db: AsyncSession, plant_id: UUID, sensor_id: str
) -> SensorAssignment:
    """Assign a sensor to a plant, removing any existing assignment for that sensor."""
    now = datetime.now(UTC)
    await db.execute(
        delete(PlantSensorAssignmentDB).where(
            PlantSensorAssignmentDB.sensor_id == sensor_id
        )
    )
    assignment = PlantSensorAssignmentDB(
        id=uuid4(),
        plant_id=plant_id,
        sensor_id=sensor_id,
        assigned_at=now,
    )
    db.add(assignment)
    await db.flush()

    plant_result = await db.execute(select(PlantDB.name).where(PlantDB.id == plant_id))
    plant_name = plant_result.scalar_one()
    return SensorAssignment(
        id=assignment.id,
        plant_id=assignment.plant_id,
        plant_name=plant_name,
        sensor_id=assignment.sensor_id,
        assigned_at=assignment.assigned_at,
    )


async def delete_sensor_assignment(db: AsyncSession, assignment_id: UUID) -> bool:
    """Delete a sensor-plant assignment by ID. Returns True if it existed."""
    result = await db.execute(
        delete(PlantSensorAssignmentDB)
        .where(PlantSensorAssignmentDB.id == assignment_id)
        .returning(PlantSensorAssignmentDB.id)
    )
    return result.scalar_one_or_none() is not None


async def get_moisture_history(
    db: AsyncSession, plant_id: UUID, since: datetime
) -> list[SensorReading]:
    """Return moisture readings for a plant since a given datetime, oldest first."""
    result = await db.execute(
        select(SensorReadingDB)
        .where(
            SensorReadingDB.plant_id == plant_id, SensorReadingDB.recorded_at >= since
        )
        .order_by(SensorReadingDB.recorded_at.asc())
    )
    return [row.to_model() for row in result.scalars().all()]


async def get_watering_history(
    db: AsyncSession, plant_id: UUID, since: datetime
) -> list[WateringEvent]:
    """Return watering events for a plant since a given datetime, oldest first."""
    result = await db.execute(
        select(WateringEventDB)
        .where(
            WateringEventDB.plant_id == plant_id, WateringEventDB.watered_at >= since
        )
        .order_by(WateringEventDB.watered_at.asc())
    )
    return [row.to_model() for row in result.scalars().all()]


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
    """Fetch only the image column for a plant (data URI bytes stored)."""
    stmt = select(PlantDB.image).where(PlantDB.id == plant_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_plant_thumbnail(db: AsyncSession, plant_id: UUID) -> bytes | None:
    """Fetch only the thumbnail column for a plant (raw JPEG bytes)."""
    stmt = select(PlantDB.thumbnail).where(PlantDB.id == plant_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def has_plant_thumbnail(db: AsyncSession, plant_id: UUID) -> bool:
    """Return True if a plant has a thumbnail without loading the blob."""
    stmt = (
        select(PlantDB.id)
        .where(PlantDB.id == plant_id, PlantDB.thumbnail.isnot(None))
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


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
    await db.execute(
        delete(SubscriptionDB).filter(SubscriptionDB.id == subscription_id)
    )


async def get_hardiness_map(db: AsyncSession, id: int) -> HardinessMap | None:
    """Retrieve a hardiness map by id."""
    db_hardiness_map = await db.get(HardinessMapDB, id)
    if db_hardiness_map is None:
        return None
    return db_hardiness_map.to_model()


async def get_hardiness_maps_batch(
    db: AsyncSession, ids: list[int]
) -> dict[int, HardinessMap]:
    """Fetch multiple hardiness maps in a single query."""
    stmt = select(HardinessMapDB).where(HardinessMapDB.id.in_(ids))
    result = await db.execute(stmt)
    return {m.id: m.to_model() for m in result.scalars()}


async def save_hardiness_map(db: AsyncSession, hardiness_map: HardinessMap) -> None:
    """Save a hardiness map to the database."""
    db_hardiness_map = HardinessMapDB.from_model(hardiness_map)
    db.add(db_hardiness_map)
