from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound

from ..database import (
    get_db,
    register_sensor as db_register_sensor,
    get_all_sensors as db_get_all_sensors,
    get_sensor_assignments as db_get_sensor_assignments,
    upsert_sensor_assignment as db_upsert_sensor_assignment,
    delete_sensor_assignment as db_delete_sensor_assignment,
)
from ..models import Sensor, SensorAssignment

sensor_router = APIRouter(prefix="/api/sensors", tags=["sensors"])
assignment_router = APIRouter(prefix="/api/sensor-assignments", tags=["sensor-assignments"])


class RegisterRequest(BaseModel):
    sensor_id: str


class AssignmentRequest(BaseModel):
    plant_id: UUID
    sensor_id: str


@sensor_router.post("/register", response_model=Sensor)
async def register_sensor(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register or re-register a sensor (upsert). Always returns 200."""
    return await db_register_sensor(db, request.sensor_id)


@sensor_router.get("", response_model=list[Sensor])
async def get_sensors(db: AsyncSession = Depends(get_db)):
    """Return all registered sensors with is_active flag."""
    return await db_get_all_sensors(db)


@assignment_router.get("", response_model=list[SensorAssignment])
async def get_assignments(db: AsyncSession = Depends(get_db)):
    return await db_get_sensor_assignments(db)


@assignment_router.post("", response_model=SensorAssignment)
async def create_assignment(request: AssignmentRequest, db: AsyncSession = Depends(get_db)):
    """Assign a sensor to a plant, moving it away from any previous plant."""
    try:
        return await db_upsert_sensor_assignment(db, request.plant_id, request.sensor_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Plant not found")


@assignment_router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: UUID, db: AsyncSession = Depends(get_db)):
    deleted = await db_delete_sensor_assignment(db, assignment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Assignment deleted"}
