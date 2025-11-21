import logging
from datetime import datetime
from typing import List
from uuid import UUID
from io import BytesIO

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import (
    delete_plant as db_delete_plant,
    get_db,
    get_plant as db_get_plant,
    get_species as db_get_species,
    load_plants,
    save_plant,
    update_plant as db_update_plant,
    upsert_species,
    get_hardiness_map as db_get_hardiness_map,
)
from ..models import Plant, PlantUpdate, Species
from ..services import (
    PerenualConfigurationError,
    fetch_perenual_enrichment,
    get_perenual_species_id,
    create_hardiness_map,
)
from ..utils import shrink_image

plant_router = APIRouter(prefix="/api/plants", tags=["plants"])

@plant_router.get("", response_model=List[Plant])
async def get_plants(db_context: AsyncSession = Depends(get_db)) -> List[Plant]:
    async with db_context as db:
        plants = await load_plants(db)
        return list(plants.values())

@plant_router.get("/species/{perenual_id}", response_model=Species)
async def get_species(perenual_id: int, db_context: AsyncSession = Depends(get_db)):
    async with db_context as db:
        species = await db_get_species(db, perenual_id)
        if species is None:
            raise HTTPException(status_code=404, detail="Species not found")
        return species

@plant_router.get("/species/{perenual_id}/hardiness-map")
async def get_hardiness_map(
    perenual_id: int,
    db_context: AsyncSession = Depends(get_db),
):
    async with db_context as db:
        species = await db_get_species(db, perenual_id)
        if species is None:
            raise HTTPException(status_code=404, detail="Species not found")
        
        if species.details.hardiness is None:
            raise HTTPException(status_code=404, detail="Hardiness not found")

        min = species.details.hardiness.min
        max = species.details.hardiness.max
        if (min is None or max is None):
            raise HTTPException(status_code=404, detail="Hardiness not found")

        indexes = list(range(int(min), int(max) + 1))
        indexes.append(0)
        hardiness_maps = [await db_get_hardiness_map(db, index) for index in indexes]
        if any(m is None for m in hardiness_maps):
            raise HTTPException(status_code=404, detail="Missing map")
        hardiness_maps = [m for m in hardiness_maps if m is not None] #just for the type checker
        image = create_hardiness_map(hardiness_maps)
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return Response(content=buffer.getvalue(), media_type="image/png")

@plant_router.get("/{plant_id}", response_model=Plant)
async def get_plant(plant_id: UUID, db_context: AsyncSession = Depends(get_db)):
    async with db_context as db:
        plant = await db_get_plant(db, plant_id)
        if plant is not None:
            return plant
        raise HTTPException(status_code=404, detail="Plant not found")

@plant_router.delete("/{plant_id}")
async def delete_plant(plant_id: UUID, db_context: AsyncSession = Depends(get_db)):
    async with db_context as db:
        await db_delete_plant(db, plant_id)
    return {"message": "Plant deleted successfully"}

@plant_router.put("")
async def set_plant(
    plant: Plant,
    background_tasks: BackgroundTasks,
    db_context: AsyncSession = Depends(get_db),
):
    async with db_context as db:
        processed_plant = plant.model_copy(update={"image": shrink_image(plant.image)})
        await save_plant(db, processed_plant)

    background_tasks.add_task(
        fetch_plant_info_and_update, processed_plant.id, processed_plant.species
    )

    return {"message": "Plant saved successfully"}

@plant_router.patch("/{plant_id}")
async def update_plant(
    plant_id: UUID,
    partial_plant: PlantUpdate,
    background_tasks: BackgroundTasks,
    db_context: AsyncSession = Depends(get_db),
):
    async with db_context as db:
        plant = await db_get_plant(db, plant_id)
        if plant is None:
            raise HTTPException(status_code=404, detail="Plant not found")
        
        partial_update = partial_plant.model_dump(exclude_unset=True, exclude_none=True)
        if "image" in partial_update:
            partial_update["image"] = shrink_image(partial_update["image"])

        update_data = plant.model_dump() | partial_update
        updated_plant = Plant(**update_data)
        updated_plant.updated_at = datetime.now()  # Update timestamp
        await db_update_plant(db, updated_plant)
        
        # If species was updated, trigger enrichment check
        if "species" in partial_update:
            new_species = partial_update["species"]
            background_tasks.add_task(
                fetch_plant_info_and_update, plant_id, new_species
            )
        
        return {"message" : "Plant updated successfully"}

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

async def fetch_plant_info_and_update(plant_id: UUID, species_name: str) -> None:
    try:
        # First, get the species_id from the API
        species = await run_in_threadpool(get_perenual_species_id, species_name)
        
        # Check if the species information is already in the database
        async with get_db() as db:
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
            plant.updated_at = datetime.now()

            await db_update_plant(db, plant)
            
    except PerenualConfigurationError as exc:
        logger.error(f"Perenual configuration error: {exc}")
        return
    except Exception as exc:
        logger.warning(
            f"Perenual API error for plant {plant_id} ({species_name}): {exc}"
        )
        return