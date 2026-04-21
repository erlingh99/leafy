import logging
from datetime import datetime, timezone
from uuid import UUID
from io import BytesIO
from base64 import b64decode

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import (
    delete_plant as db_delete_plant,
    get_db,
    get_plant as db_get_plant,
    get_species as db_get_species,
    water_plant as db_water_plant,
    water_all_plants as db_water_all_plants,
    load_plants_without_images,
    save_plant,
    update_plant as db_update_plant,
    get_plant_image as db_get_plant_image,
    get_plant_thumbnail as db_get_plant_thumbnail,
    has_plant_thumbnail as db_has_plant_thumbnail,
    get_hardiness_maps_batch as db_get_hardiness_maps_batch,
    upsert_species,
    async_session_maker,
)
from ..models import Plant, PlantUpdate, PlantResponse, Species
from ..services import (
    PerenualConfigurationError,
    fetch_perenual_enrichment,
    get_perenual_species_id,
    create_hardiness_map,
)
from ..utils import shrink_image
from ..utils import create_thumbnail

plant_router = APIRouter(prefix="/api/plants", tags=["plants"])

_hardiness_cache: dict[tuple[int, ...], bytes] = {}


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
    _hardiness_cache[ids] = result
    return result


@plant_router.get("", response_model=list[PlantResponse])
async def get_plants(db: AsyncSession = Depends(get_db)) -> list[PlantResponse]:
    rows = await load_plants_without_images(db)
    responses: list[PlantResponse] = []
    for r in rows:
        responses.append(
            PlantResponse(
                id=r["id"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                name=r["name"],
                species_username=r["species_username"],
                species=r["species"],
                watering_interval=r["watering_interval"],
                last_watered=r["last_watered"],
                perenual_species_id=r["perenual_species_id"],
                image_url=(f"/api/plants/{r['id']}/image" if r["has_image"] else None),
                thumbnail_url=(f"/api/plants/{r['id']}/thumbnail" if r["has_thumbnail"] else None),
            )
        )
    return responses

@plant_router.get("/species/{perenual_id}", response_model=Species)
async def get_species(perenual_id: int, db: AsyncSession = Depends(get_db)):
    species = await db_get_species(db, perenual_id)
    if species is None:
        raise HTTPException(status_code=404, detail="Species not found")
    return species

@plant_router.get("/species/{perenual_id}/hardiness-map")
async def get_hardiness_map(
    perenual_id: int,
    db: AsyncSession = Depends(get_db),
):
    species = await db_get_species(db, perenual_id)
    if species is None:
        raise HTTPException(status_code=404, detail="Species not found")
    
    if species.details.hardiness is None:
        raise HTTPException(status_code=404, detail="Hardiness not found")

    min_val = species.details.hardiness.min
    max_val = species.details.hardiness.max
    if (min_val is None or max_val is None):
        raise HTTPException(status_code=404, detail="Hardiness not found")

    ids = tuple(sorted([*range(min_val, max_val + 1), 0]))
    try:
        png_bytes = await _get_composed_hardiness_map(db, ids)
    except ValueError:
        raise HTTPException(status_code=404, detail="Missing map")

    headers = {"Cache-Control": "public, max-age=86400"}
    return Response(content=png_bytes, media_type="image/png", headers=headers)

@plant_router.get("/{plant_id}", response_model=PlantResponse)
async def get_plant(plant_id: UUID, db: AsyncSession = Depends(get_db)):
    db_plant = await db_get_plant(db, plant_id)
    if db_plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Build response without inline image data
    # Check if a thumbnail exists in the database (avoid loading blob)
    thumb_exists = await db_has_plant_thumbnail(db, plant_id)

    resp = PlantResponse(
        id=db_plant.id,
        created_at=db_plant.created_at,
        updated_at=db_plant.updated_at,
        name=db_plant.name,
        species_username=db_plant.species_username,
        species=db_plant.species,
        watering_interval=db_plant.watering_interval,
        last_watered=db_plant.last_watered,
        perenual_species_id=db_plant.perenual_species_id,
        image_url=(f"/api/plants/{db_plant.id}/image" if db_plant.image else None),
        thumbnail_url=(f"/api/plants/{db_plant.id}/thumbnail" if thumb_exists else None),
    )
    return resp

@plant_router.delete("/{plant_id}")
async def delete_plant(plant_id: UUID, db: AsyncSession = Depends(get_db)):
    await db_delete_plant(db, plant_id)
    return {"message": "Plant deleted successfully"}


@plant_router.get("/{plant_id}/image")
async def stream_plant_image(plant_id: UUID, db: AsyncSession = Depends(get_db)):
    """Return the full image for a plant as raw bytes."""
    image_data = await db_get_plant_image(db, plant_id)
    if not image_data:
        raise HTTPException(status_code=404, detail="Image not found")

    # Normalize to bytes
    if isinstance(image_data, str):
        image_bytes = image_data.encode('utf-8')
    else:
        image_bytes = bytes(image_data)

    # If the DB contains a data URI, decode it and extract the mime type
    media_type = "image/jpeg"
    if image_bytes.startswith(b"data:"):
        try:
            header, b64part = image_bytes.split(b",", 1)
        except ValueError:
            raise HTTPException(status_code=500, detail="Invalid image data stored")

        header_str = header.decode('utf-8', errors='ignore')
        # header example: data:image/png;base64
        try:
            mime_part = header_str.split(':', 1)[1].split(';', 1)[0]
            if mime_part:
                media_type = mime_part
        except Exception:
            media_type = "image/jpeg"

        try:
            image_bytes = b64decode(b64part)
        except Exception:
            raise HTTPException(status_code=500, detail="Invalid base64 image data")
    else:
        # Try to detect common formats from magic bytes
        if image_bytes.startswith(b"\x89PNG"):
            media_type = "image/png"
        elif image_bytes.startswith(b"\xff\xd8"):
            media_type = "image/jpeg"
        elif image_bytes[:4] == b"GIF8":
            media_type = "image/gif"

    headers = {"Cache-Control": "public, max-age=86400"}
    return Response(content=image_bytes, media_type=media_type, headers=headers)


@plant_router.get("/{plant_id}/thumbnail")
async def stream_plant_thumbnail(plant_id: UUID, db: AsyncSession = Depends(get_db)):
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
    db: AsyncSession = Depends(get_db),
):
    thumbnail_bytes = None
    if plant.image:
        shrunk_image_bytes = await run_in_threadpool(shrink_image, plant.image)
        thumbnail_bytes = await run_in_threadpool(create_thumbnail, shrunk_image_bytes)
        processed_plant = plant.model_copy(update={"image": shrunk_image_bytes})
    else:
        processed_plant = plant

    await save_plant(db, processed_plant, thumbnail=thumbnail_bytes)

    background_tasks.add_task(
        fetch_plant_info_and_update, processed_plant.id, processed_plant.species
    )

    return PlantResponse(
        id=processed_plant.id,
        created_at=processed_plant.created_at,
        updated_at=processed_plant.updated_at,
        name=processed_plant.name,
        species_username=processed_plant.species_username,
        species=processed_plant.species,
        watering_interval=processed_plant.watering_interval,
        last_watered=processed_plant.last_watered,
        perenual_species_id=processed_plant.perenual_species_id,
        image_url=(f"/api/plants/{processed_plant.id}/image" if processed_plant.image else None),
        thumbnail_url=(f"/api/plants/{processed_plant.id}/thumbnail" if thumbnail_bytes else None),
    )

@plant_router.patch("/{plant_id}", response_model=PlantResponse)
async def update_plant(
    plant_id: UUID,
    partial_plant: PlantUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
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
            partial_update["image"] = await run_in_threadpool(shrink_image, partial_update["image"])
            thumbnail_update = await run_in_threadpool(create_thumbnail, partial_update["image"])
        else:
            partial_update["image"] = None

    update_data = plant.model_dump() | partial_update
    updated_plant = Plant(**update_data)
    updated_plant.updated_at = datetime.now(timezone.utc)
    await db_update_plant(db, updated_plant, thumbnail=thumbnail_update, set_thumbnail=set_thumbnail)

    if "species" in partial_update:
        background_tasks.add_task(
            fetch_plant_info_and_update, plant_id, partial_update["species"]
        )

    # Determine thumbnail existence after update
    if not set_thumbnail:
        has_thumb = await db_has_plant_thumbnail(db, plant_id)
    else:
        has_thumb = thumbnail_update is not None

    return PlantResponse(
        id=updated_plant.id,
        created_at=updated_plant.created_at,
        updated_at=updated_plant.updated_at,
        name=updated_plant.name,
        species_username=updated_plant.species_username,
        species=updated_plant.species,
        watering_interval=updated_plant.watering_interval,
        last_watered=updated_plant.last_watered,
        perenual_species_id=updated_plant.perenual_species_id,
        image_url=(f"/api/plants/{updated_plant.id}/image" if updated_plant.image else None),
        thumbnail_url=(f"/api/plants/{updated_plant.id}/thumbnail" if has_thumb else None),
    )

@plant_router.post("/water/all")
async def water_all_plants(
    db: AsyncSession = Depends(get_db)
):
    """Water multiple plants in a single transaction."""
    await db_water_all_plants(db)
    return {"message": "Successfully watered all plants"}

@plant_router.post("/water/{plant_id}")
async def water_plant(
    plant_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Water a single plant."""
    result = await db_water_plant(db, plant_id)
    if not result:
        raise HTTPException(status_code=404, detail="Plant not found")
    return {"message": "Plant watered successfully"}



logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

async def fetch_plant_info_and_update(plant_id: UUID, species_name: str) -> None:
    try:
        # First, get the species_id from the API
        species = await run_in_threadpool(get_perenual_species_id, species_name)
        
        # Check if the species information is already in the database
        async with async_session_maker() as db:
            existing_species = await db_get_species(db, species.id)
            
            if existing_species is not None:
                # Use existing data from database
                logger.debug(f"Using existing species data from database for species_id {species.id}")
                enrichment = existing_species
            else:
                # Fetch full enrichment data from API
                logger.debug(f"Fetching species data from API for species_id {species.id}")
                enrichment = await run_in_threadpool(fetch_perenual_enrichment, species)
                await upsert_species(db, enrichment)
            
            # Update the plant with the species_id
            plant = await db_get_plant(db, plant_id)
            if plant is None:
                logger.warning(f"Plant {plant_id} no longer exists; skipping enrichment")
                return

            plant.perenual_species_id = enrichment.perenual_id
            plant.updated_at = datetime.now(timezone.utc)

            await db_update_plant(db, plant)
            await db.commit()
            
    except PerenualConfigurationError as exc:
        logger.error(f"Perenual configuration error: {exc}")
        return
    except Exception as exc:
        logger.warning(
            f"Perenual API error for plant {plant_id} ({species_name}): {exc}"
        )
        return