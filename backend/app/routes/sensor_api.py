import asyncio
import json
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.exc import NoResultFound

from ..config import SENSOR_CALIBRATION_PORT, SENSOR_LAN_DOMAIN
from ..database import (
    delete_sensor_assignment as db_delete_sensor_assignment,
)
from ..database import (
    get_all_sensors as db_get_all_sensors,
)
from ..database import (
    get_sensor_assignments as db_get_sensor_assignments,
)
from ..database import (
    register_sensor as db_register_sensor,
)
from ..database import (
    update_sensor_calibration as db_update_sensor_calibration,
)
from ..database import (
    upsert_sensor_assignment as db_upsert_sensor_assignment,
)
from ..dependencies import DbSession
from ..models import Sensor, SensorAssignment

logger = logging.getLogger("uvicorn.error")

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
async def register_sensor(request: RegisterRequest, db: DbSession):
    """Register or re-register a sensor (upsert). Always returns 200."""
    return await db_register_sensor(db, request.sensor_id)


@sensor_router.get("", response_model=list[Sensor])
async def get_sensors(db: DbSession):
    """Return all registered sensors with is_active flag."""
    return await db_get_all_sensors(db)


@sensor_router.get("/{sensor_id}/calibrate/stream")
async def calibrate_stream(sensor_id: str):
    """SSE stream of 1 Hz readings from the sensor's calibration TCP server.

    Opens a TCP connection to leafy-{sensor_id}.{domain}:{port} and relays
    each JSON line as an SSE event. Only one stream per sensor is active at
    a time (enforced by the sensor's TCP server).
    """
    host = f"leafy-{sensor_id}.{SENSOR_LAN_DOMAIN}"
    port = SENSOR_CALIBRATION_PORT

    async def generator():
        if sensor_id in _sensor_connections:
            yield "data: {}\n\n".format(
                json.dumps(
                    {
                        "error": "Another calibration stream is already active for this sensor."
                    }
                )
            )
            return

        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port), timeout=5.0
            )
        except (TimeoutError, OSError) as e:
            yield "data: {}\n\n".format(json.dumps({"error": str(e)}))
            return

        _sensor_connections[sensor_id] = (reader, writer)
        _sensor_locks[sensor_id] = asyncio.Lock()

        try:
            while True:
                try:
                    line = await asyncio.wait_for(reader.readline(), timeout=3.0)
                    if not line:
                        break
                    yield f"data: {line.decode().strip()}\n\n"
                except TimeoutError:
                    yield "data: {}\n\n".format(json.dumps({"error": "timeout"}))
        finally:
            _sensor_connections.pop(sensor_id, None)
            try:
                writer.close()
                await writer.wait_closed()
            except OSError:
                logger.debug(
                    "Error closing sensor connection for %s", sensor_id, exc_info=True
                )

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@sensor_router.post("/{sensor_id}/calibrate", response_model=Sensor)
async def calibrate_sensor(
    sensor_id: str,
    body: CalibrateRequest,
    db: DbSession,
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
async def get_assignments(db: DbSession):
    return await db_get_sensor_assignments(db)


@assignment_router.post("", response_model=SensorAssignment)
async def create_assignment(request: AssignmentRequest, db: DbSession):
    """Assign a sensor to a plant, moving it away from any previous plant."""
    try:
        return await db_upsert_sensor_assignment(
            db, request.plant_id, request.sensor_id
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Plant not found")


@assignment_router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: UUID, db: DbSession):
    deleted = await db_delete_sensor_assignment(db, assignment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Assignment deleted"}
