import logging
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
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
)
from ..models import Plant, PlantUpdate, Species
from ..services import PerenualConfigurationError, fetch_perenual_enrichment
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
async def update_plant(plant_id: UUID, partial_plant: PlantUpdate, db_context: AsyncSession = Depends(get_db)):
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
        return {"message" : "Plant updated successfully"}

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

async def fetch_plant_info_and_update(plant_id: UUID, species: str) -> None:
    try:
        enrichment = await run_in_threadpool(fetch_perenual_enrichment, species)
    except PerenualConfigurationError as exc:
        logger.error(f"Perenual configuration error: {exc}")
        return
    except HTTPException as exc:
        logger.warning(
            f"Perenual API error for plant {plant_id} ({species}): {exc.detail}"
        )
        return

    async with get_db() as db:
        await upsert_species(db, enrichment)
        plant = await db_get_plant(db, plant_id)
        if plant is None:
            logger.warning(f"Plant {plant_id} no longer exists; skipping enrichment")
            return

        plant.perenual_species_id = enrichment.perenual_id
        plant.updated_at = datetime.now()

        await db_update_plant(db, plant)