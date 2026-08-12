import asyncio
import logging
from binascii import Error as BinasciiError
from datetime import datetime, timedelta, timezone
from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel
from pydantic import Field as PydanticField
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import AUTO_WATER_RISE_THRESHOLD, WATER_DEBOUNCE_HOURS
from ..database import (
    WaterResult,
    async_session_maker,
    get_plant_sensor_data,
    load_plants_without_images,
    record_moisture_reading,
    save_plant,
    upsert_species,
)
from ..database import (
    delete_plant as db_delete_plant,
)
from ..database import (
    get_hardiness_maps_batch as db_get_hardiness_maps_batch,
)
from ..database import (
    get_moisture_history as db_get_moisture_history,
)
from ..database import (
    get_plant as db_get_plant,
)
from ..database import (
    get_plant_image as db_get_plant_image,
)
from ..database import (
    get_plant_thumbnail as db_get_plant_thumbnail,
)
from ..database import (
    get_species as db_get_species,
)
from ..database import (
    get_watering_history as db_get_watering_history,
)
from ..database import (
    has_plant_thumbnail as db_has_plant_thumbnail,
)
from ..database import (
    update_plant as db_update_plant,
)
from ..database import (
    water_all_plants as db_water_all_plants,
)
from ..database import (
    water_plant as db_water_plant,
)
from ..dependencies import DbSession
from ..models import (
    Plant,
    PlantResponse,
    PlantUpdate,
    SensorReading,
    Species,
    WateringEvent,
)
from ..services import (
    PerenualConfigurationError,
    create_hardiness_map,
    fetch_perenual_enrichment,
    get_perenual_species_id,
)
from ..utils import create_thumbnail, parse_data_uri, shrink_image

plant_router = APIRouter(prefix="/api/plants", tags=["plants"])
sensor_router = APIRouter(prefix="/api", tags=["sensor"])

logger = logging.getLogger("uvicorn.error")


class MoistureReading(BaseModel):
    sensor_id: str
    level: float = PydanticField(ge=0.0, le=100.0)


def _plant_response(
    plant: Plant,
    *,
    has_image: bool,
    has_thumbnail: bool,
    sensor_id: str | None = None,
    moisture_level: float | None = None,
    moisture_updated_at: datetime | None = None,
) -> PlantResponse:
    return PlantResponse(
        id=plant.id,
        created_at=plant.created_at,
        updated_at=plant.updated_at,
        name=plant.name,
        species_username=plant.species_username,
        species=plant.species,
        watering_interval=plant.watering_interval,
        last_watered=plant.last_watered,
        perenual_species_id=plant.perenual_species_id,
        image_url=(f"/api/plants/{plant.id}/image" if has_image else None),
        thumbnail_url=(f"/api/plants/{plant.id}/thumbnail" if has_thumbnail else None),
        sensor_id=sensor_id,
        moisture_level=moisture_level,
        moisture_updated_at=moisture_updated_at,
    )


_hardiness_cache: dict[tuple[int, ...], bytes] = {}
_HARDINESS_CACHE_MAX_SIZE = 64


async def _get_composed_hardiness_map(db: AsyncSession, ids: tuple[int, ...]) -> bytes:
    """Fetch hardiness base layers and compose them, caching by sorted id tuple."""
    if ids in _hardiness_cache:
        return _hardiness_cache[ids]
    maps_by_id = await db_get_hardiness_maps_batch(db, list(ids))
    if any(i not in maps_by_id for i in ids):
        raise ValueError("Missing hardiness map")
    h_maps = [maps_by_id[i] for i in ids]

    def _compose(maps: list) -> bytes:
        image = create_hardiness_map(maps)
        buf = BytesIO()
        image.save(buf, format="PNG")
        return buf.getvalue()

    result = await run_in_threadpool(_compose, h_maps)
    if len(_hardiness_cache) >= _HARDINESS_CACHE_MAX_SIZE:
        _hardiness_cache.clear()
    _hardiness_cache[ids] = result
    return result


@plant_router.get("", response_model=list[PlantResponse])
async def get_plants(db: DbSession) -> list[PlantResponse]:
    rows = await load_plants_without_images(db)
    _sensor_keys = {
        "sensor_id",
        "moisture_level",
        "moisture_updated_at",
        "has_image",
        "has_thumbnail",
    }
    return [
        _plant_response(
            Plant(**{k: v for k, v in r.items() if k not in _sensor_keys}),
            has_image=r["has_image"],
            has_thumbnail=r["has_thumbnail"],
            sensor_id=r.get("sensor_id"),
            moisture_level=r.get("moisture_level"),
            moisture_updated_at=r.get("moisture_updated_at"),
        )
        for r in rows
    ]


@plant_router.get("/species/{perenual_id}", response_model=Species)
async def get_species(perenual_id: int, db: DbSession):
    species = await db_get_species(db, perenual_id)
    if species is None:
        raise HTTPException(status_code=404, detail="Species not found")
    return species


@plant_router.get("/species/{perenual_id}/hardiness-map")
async def get_hardiness_map(
    perenual_id: int,
    db: DbSession,
):
    species = await db_get_species(db, perenual_id)
    if species is None:
        raise HTTPException(status_code=404, detail="Species not found")

    if species.details.hardiness is None:
        raise HTTPException(status_code=404, detail="Hardiness not found")

    min_val = species.details.hardiness.min
    max_val = species.details.hardiness.max
    if min_val is None or max_val is None:
        raise HTTPException(status_code=404, detail="Hardiness not found")

    if min_val > max_val:
        raise HTTPException(status_code=422, detail="Invalid hardiness zone range")

    ids = tuple(sorted([*range(min_val, max_val + 1), 0]))
    try:
        png_bytes = await _get_composed_hardiness_map(db, ids)
    except ValueError:
        raise HTTPException(status_code=404, detail="Missing map")

    headers = {"Cache-Control": "public, max-age=86400"}
    return Response(content=png_bytes, media_type="image/png", headers=headers)


@plant_router.get("/{plant_id}", response_model=PlantResponse)
async def get_plant(plant_id: UUID, db: DbSession):
    db_plant = await db_get_plant(db, plant_id)
    if db_plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")

    (
        thumb_exists,
        (sensor_id, moisture_level, moisture_updated_at),
    ) = await asyncio.gather(
        db_has_plant_thumbnail(db, plant_id),
        get_plant_sensor_data(db, plant_id),
    )
    return _plant_response(
        db_plant,
        has_image=bool(db_plant.image),
        has_thumbnail=thumb_exists,
        sensor_id=sensor_id,
        moisture_level=moisture_level,
        moisture_updated_at=moisture_updated_at,
    )


@plant_router.delete("/{plant_id}")
async def delete_plant(plant_id: UUID, db: DbSession):
    await db_delete_plant(db, plant_id)
    return {"message": "Plant deleted successfully"}


@plant_router.get("/{plant_id}/image")
async def stream_plant_image(plant_id: UUID, db: DbSession):
    """Return the full image for a plant as raw bytes."""
    image_data = await db_get_plant_image(db, plant_id)
    if not image_data:
        raise HTTPException(status_code=404, detail="Image not found")

    image_bytes = (
        image_data.encode("utf-8") if isinstance(image_data, str) else bytes(image_data)
    )
    try:
        image_bytes, media_type = parse_data_uri(image_bytes)
    except (ValueError, BinasciiError):
        raise HTTPException(status_code=500, detail="Invalid image data stored")

    headers = {"Cache-Control": "public, max-age=86400"}
    return Response(content=image_bytes, media_type=media_type, headers=headers)


@plant_router.get("/{plant_id}/thumbnail")
async def stream_plant_thumbnail(plant_id: UUID, db: DbSession):
    """Return the stored thumbnail (raw JPEG bytes)."""
    thumb = await db_get_plant_thumbnail(db, plant_id)
    if not thumb:
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    headers = {"Cache-Control": "public, max-age=86400"}
    return Response(content=thumb, media_type="image/jpeg", headers=headers)


@plant_router.put("", response_model=PlantResponse)
async def set_plant(
    plant: Plant,
    background_tasks: BackgroundTasks,
    db: DbSession,
):
    thumbnail_bytes = None
    if plant.image:
        shrunk_image_bytes = await run_in_threadpool(shrink_image, plant.image)
        thumbnail_bytes = await run_in_threadpool(create_thumbnail, shrunk_image_bytes)
        processed_plant = plant.model_copy(update={"image": shrunk_image_bytes})
    else:
        processed_plant = plant

    await save_plant(db, processed_plant, thumbnail=thumbnail_bytes)
    # Commit before returning so the thumbnail is visible when the client immediately
    # re-requests it, and so the background enrichment task can find the plant.
    # The get_db dependency will attempt a second commit on cleanup, which is a no-op.
    await db.commit()

    background_tasks.add_task(
        fetch_plant_info_and_update, processed_plant.id, processed_plant.species
    )

    return _plant_response(
        processed_plant,
        has_image=bool(processed_plant.image),
        has_thumbnail=bool(thumbnail_bytes),
    )


@plant_router.patch("/{plant_id}", response_model=PlantResponse)
async def update_plant(
    plant_id: UUID,
    partial_plant: PlantUpdate,
    background_tasks: BackgroundTasks,
    db: DbSession,
):
    plant = await db_get_plant(db, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")

    partial_update = partial_plant.model_dump(exclude_unset=True)
    thumbnail_update: bytes | None = None
    set_thumbnail = False
    if "image" in partial_update:
        set_thumbnail = True
        if partial_update["image"]:
            partial_update["image"] = await run_in_threadpool(
                shrink_image, partial_update["image"]
            )
            thumbnail_update = await run_in_threadpool(
                create_thumbnail, partial_update["image"]
            )
        else:
            partial_update["image"] = None

    update_data = plant.model_dump() | partial_update
    updated_plant = Plant(**update_data)
    updated_plant.updated_at = datetime.now(timezone.utc)
    await db_update_plant(
        db, updated_plant, thumbnail=thumbnail_update, set_thumbnail=set_thumbnail
    )
    # Commit before returning so the background enrichment task can write without
    # deadlocking against this session's still-open write transaction.
    await db.commit()

    if "species" in partial_update:
        background_tasks.add_task(
            fetch_plant_info_and_update, plant_id, partial_update["species"]
        )

    if not set_thumbnail:
        has_thumb = await db_has_plant_thumbnail(db, plant_id)
    else:
        has_thumb = thumbnail_update is not None

    return _plant_response(
        updated_plant,
        has_image=bool(updated_plant.image),
        has_thumbnail=has_thumb,
    )


@plant_router.post("/water/all")
async def water_all_plants(db: DbSession):
    """Water multiple plants in a single transaction, skipping recently watered ones."""
    await db_water_all_plants(db, debounce_hours=WATER_DEBOUNCE_HOURS)
    return {"message": "Successfully watered all plants"}


@plant_router.post("/water/{plant_id}")
async def water_plant(plant_id: UUID, db: DbSession):
    """Water a single plant."""
    result = await db_water_plant(db, plant_id, debounce_hours=WATER_DEBOUNCE_HOURS)
    if result == WaterResult.NOT_FOUND:
        raise HTTPException(status_code=404, detail="Plant not found")
    if result == WaterResult.DEBOUNCED:
        return {"result": "debounced", "message": "Plant already watered recently"}
    return {"result": "watered", "message": "Plant watered successfully"}


@plant_router.get("/{plant_id}/moisture-history", response_model=list[SensorReading])
async def get_moisture_history(
    plant_id: UUID,
    db: DbSession,
    days: int = Query(default=7, ge=1, le=365),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    return await db_get_moisture_history(db, plant_id, since)


@plant_router.get("/{plant_id}/watering-history", response_model=list[WateringEvent])
async def get_watering_history(
    plant_id: UUID,
    db: DbSession,
    days: int = Query(default=30, ge=1, le=365),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    return await db_get_watering_history(db, plant_id, since)


@sensor_router.post("/moisture")
async def update_moisture(
    reading: MoistureReading,
    db: DbSession,
):
    """Receive a moisture reading from an ESP32 sensor and persist it.

    Always returns 200; updates the sensor's last_seen_at even if not yet assigned to a plant.
    """
    await record_moisture_reading(
        db,
        reading.sensor_id,
        reading.level,
        auto_water_rise_threshold=AUTO_WATER_RISE_THRESHOLD,
        water_debounce_hours=WATER_DEBOUNCE_HOURS,
    )
    return {"message": "Moisture received"}


# Deduplicates concurrent background-task fetches for the same species name.
_species_futures: dict[str, "asyncio.Future[int]"] = {}


async def _fetch_and_cache_species(species_name: str) -> int:
    """Fetch species from Perenual and upsert to DB, returning perenual_id.

    If a concurrent task is already fetching the same species name, waits for
    that result instead of issuing a duplicate API call.
    """
    existing = _species_futures.get(species_name)
    if existing is not None:
        return await asyncio.shield(existing)

    fut: asyncio.Future[int] = asyncio.get_running_loop().create_future()
    _species_futures[species_name] = fut
    try:
        species = await get_perenual_species_id(species_name)
        async with async_session_maker() as db:
            existing_species = await db_get_species(db, species.id)
            if existing_species is not None:
                logger.debug(
                    "Using existing species data for species_id %s", species.id
                )
                enrichment = existing_species
            else:
                logger.debug(
                    "Fetching species data from API for species_id %s", species.id
                )
                enrichment = await fetch_perenual_enrichment(species)
                await upsert_species(db, enrichment)
                await db.commit()
        fut.set_result(enrichment.perenual_id)
        return enrichment.perenual_id
    except Exception as exc:
        if not fut.done():
            fut.set_exception(exc)
            fut.exception()  # mark as retrieved so asyncio doesn't log "never retrieved"
        raise
    finally:
        _species_futures.pop(species_name, None)


async def fetch_plant_info_and_update(plant_id: UUID, species_name: str) -> None:
    try:
        perenual_id = await _fetch_and_cache_species(species_name)

        async with async_session_maker() as db:
            plant = await db_get_plant(db, plant_id)
            if plant is None:
                logger.warning(
                    "Plant %s no longer exists; skipping enrichment", plant_id
                )
                return
            plant.perenual_species_id = perenual_id
            plant.updated_at = datetime.now(timezone.utc)
            await db_update_plant(db, plant)
            await db.commit()

    except PerenualConfigurationError as exc:
        logger.error("Perenual configuration error: %s", exc)
    except (ValueError, SQLAlchemyError) as exc:
        logger.warning(
            "Perenual API error for plant %s (%s): %s", plant_id, species_name, exc
        )
        return
