import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound

from ..config import SENSOR_CALIBRATION_PORT, SENSOR_LAN_DOMAIN
from ..database import (
    get_db,
    register_sensor as db_register_sensor,
    get_all_sensors as db_get_all_sensors,
    get_sensor_assignments as db_get_sensor_assignments,
    upsert_sensor_assignment as db_upsert_sensor_assignment,
    delete_sensor_assignment as db_delete_sensor_assignment,
    update_sensor_calibration as db_update_sensor_calibration,
)
from ..models import Sensor, SensorAssignment

sensor_router = APIRouter(prefix="/api/sensors", tags=["sensors"])
assignment_router = APIRouter(
    prefix="/api/sensor-assignments", tags=["sensor-assignments"]
)

# Active TCP connections to sensor calibration servers, keyed by sensor_id.
# Shared between the SSE stream and calibrate POST endpoints.
_sensor_connections: dict[str, tuple[asyncio.StreamReader, asyncio.StreamWriter]] = {}
_sensor_locks: dict[str, asyncio.Lock] = {}


class RegisterRequest(BaseModel):
    sensor_id: str


class AssignmentRequest(BaseModel):
    plant_id: UUID
    sensor_id: str


class CalibrateRequest(BaseModel):
    adc_dry: int
    adc_wet: int


@sensor_router.post("/register", response_model=Sensor)
async def register_sensor(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register or re-register a sensor (upsert). Always returns 200."""
    return await db_register_sensor(db, request.sensor_id)


@sensor_router.get("", response_model=list[Sensor])
async def get_sensors(db: AsyncSession = Depends(get_db)):
    """Return all registered sensors with is_active flag."""
    return await db_get_all_sensors(db)


@sensor_router.get("/{sensor_id}/calibrate/stream")
async def calibrate_stream(sensor_id: str, request: Request):
    """SSE stream of 1 Hz readings from the sensor's calibration TCP server.

    Opens a TCP connection to leafy-{sensor_id}.{domain}:{port} and relays
    each JSON line as an SSE event. Only one stream per sensor is active at
    a time (enforced by the sensor's TCP server).
    """
    host = "leafy-{}.{}".format(sensor_id, SENSOR_LAN_DOMAIN)
    port = SENSOR_CALIBRATION_PORT

    async def generator():
        try:
            reader, writer = await asyncio.open_connection(host, port)
        except OSError as e:
            yield "data: {}\n\n".format(json.dumps({"error": str(e)}))
            return

        if sensor_id in _sensor_connections:
            writer.close()
            await writer.wait_closed()
            yield "data: {}\n\n".format(
                json.dumps(
                    {
                        "error": "Another calibration stream is already active for this sensor."
                    }
                )
            )
            return

        _sensor_connections[sensor_id] = (reader, writer)
        _sensor_locks[sensor_id] = asyncio.Lock()

        try:
            while not await request.is_disconnected():
                try:
                    line = await asyncio.wait_for(reader.readline(), timeout=3.0)
                    if not line:
                        break
                    yield "data: {}\n\n".format(line.decode().strip())
                except asyncio.TimeoutError:
                    yield "data: {}\n\n".format(json.dumps({"error": "timeout"}))
        finally:
            _sensor_connections.pop(sensor_id, None)
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@sensor_router.post("/{sensor_id}/calibrate", response_model=Sensor)
async def calibrate_sensor(
    sensor_id: str,
    body: CalibrateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send calibration values to the sensor and persist them in the database.

    Requires an active calibration stream for this sensor (409 if none).
    """
    conn = _sensor_connections.get(sensor_id)
    if conn is None:
        raise HTTPException(
            status_code=409,
            detail="No active calibration stream for this sensor. Open the calibration dialog first.",
        )

    _, writer = conn
    lock = _sensor_locks.get(sensor_id)
    if lock is None:
        raise HTTPException(
            status_code=409, detail="No active calibration stream for this sensor."
        )

    async with lock:
        cmd = json.dumps({"adc_dry": body.adc_dry, "adc_wet": body.adc_wet}) + "\n"
        writer.write(cmd.encode())
        try:
            await writer.drain()
        except OSError:
            raise HTTPException(
                status_code=409,
                detail="Calibration stream disconnected. Please reopen the calibration dialog.",
            )

    sensor = await db_update_sensor_calibration(
        db, sensor_id, body.adc_dry, body.adc_wet
    )
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@assignment_router.get("", response_model=list[SensorAssignment])
async def get_assignments(db: AsyncSession = Depends(get_db)):
    return await db_get_sensor_assignments(db)


@assignment_router.post("", response_model=SensorAssignment)
async def create_assignment(
    request: AssignmentRequest, db: AsyncSession = Depends(get_db)
):
    """Assign a sensor to a plant, moving it away from any previous plant."""
    try:
        return await db_upsert_sensor_assignment(
            db, request.plant_id, request.sensor_id
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Plant not found")


@assignment_router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: UUID, db: AsyncSession = Depends(get_db)):
    deleted = await db_delete_sensor_assignment(db, assignment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Assignment deleted"}
