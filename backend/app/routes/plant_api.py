from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession


from ..models import Plant, PlantUpdate
from ..database import get_db, load_plants, save_plant, delete_plant as db_delete_plant, update_plant as db_update_plant

plant_router = APIRouter(prefix="/api/plants", tags=["plants"])

@plant_router.get("", response_model=List[Plant])
async def get_plants(db_context: AsyncSession = Depends(get_db)) -> List[Plant]:
    async with db_context as db:
        plants = await load_plants(db)
        return list(plants.values())

@plant_router.get("/{plant_id}", response_model=Plant)
async def get_plant(plant_id: UUID, db_context: AsyncSession = Depends(get_db)):
    async with db_context as db:
        plants = await load_plants(db)
        if plant_id in plants:
            return plants[plant_id]
        raise HTTPException(status_code=404, detail="Plant not found")

@plant_router.delete("/{plant_id}")
async def delete_plant(plant_id: UUID, db_context: AsyncSession = Depends(get_db)):
    async with db_context as db:
        await db_delete_plant(db, plant_id)
    return {"message": "Plant deleted successfully"}

@plant_router.put("")
async def set_plant(plant: Plant, db_context: AsyncSession = Depends(get_db)):
    async with db_context as db:
        await save_plant(db, plant)
    return {"message" : "Planted saved succesfully"}

@plant_router.patch("/{plant_id}")
async def update_plant(plant_id: UUID, partial_plant: PlantUpdate, db_context: AsyncSession = Depends(get_db)):
    async with db_context as db:
        plants = await load_plants(db)
        if plant_id in plants:
            plant = plants[plant_id]
            update_data = plant.model_dump() | partial_plant.model_dump(exclude_unset=True, exclude_none=True)
            updated_plant = Plant(**update_data)
            updated_plant.updated_at = datetime.now()  # Update timestamp
            await db_update_plant(db, updated_plant)
            return {"message" : "Plant updated successfully"}
        raise HTTPException(status_code=404, detail="Plant not found")