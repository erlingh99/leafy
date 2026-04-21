from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.gzip import GZipMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import logging
from contextlib import asynccontextmanager
from .routes import plant_api, subscription_api
from .database import init_db, save_hardiness_map, get_hardiness_map, async_session_maker
from .subscription import send_email
from .config import BREVO_API_KEY, SENDER_EMAIL
from .services import get_hardiness_base_maps
from .models import HardinessMap

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)  # single authoritative setLevel for the shared uvicorn.error logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.debug("Initializing...")
    await init_db()
    scheduler = None
    if BREVO_API_KEY and SENDER_EMAIL:
        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            send_email,
            trigger="cron",
            hour=12,
            minute=0,
            misfire_grace_time=12*60*60, #12 hours
            args=(BREVO_API_KEY, )
        )
        scheduler.start()
        logger.debug("Email reminders activated")
    else:
        logger.debug("Skipping email reminders (missing %s)", ", ".join(
            k for k, v in [("BREVO_API_KEY", BREVO_API_KEY), ("SENDER_EMAIL", SENDER_EMAIL)] if not v
        ))

    async with async_session_maker() as db:
        map = await get_hardiness_map(db ,0)

    if map is None:
        logger.debug("Maps not found in database. Fetching...")
        basemaps = await get_hardiness_base_maps()
        async with async_session_maker() as db:
            for idx, map in basemaps:
                await save_hardiness_map(db, hardiness_map=HardinessMap(id=idx, image=map))

    logger.debug("Initialized")

    try:
        yield
    finally:
        logger.info("Shutting down")
        if scheduler:
            scheduler.shutdown()

app = FastAPI(lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size = 1000, compresslevel=5)

# Mount static files for assets
app.mount("/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets")

# Include API routers
app.include_router(plant_api.plant_router)
app.include_router(subscription_api.subscription_router)

@app.get("/favicon.ico", include_in_schema=False)
async def serveIcon():
    return FileResponse("../frontend/dist/favicon.ico")

@app.get("/site.webmanifest", include_in_schema=False)
async def serveManifest():
    return FileResponse("../frontend/dist/site.webmanifest")

@app.get("/apple-touch-icon.png", include_in_schema=False)
async def serveAppleIcon():
    return FileResponse("../frontend/dist/apple-touch-icon.png")

@app.get("/android-chrom-192x192.ico", include_in_schema=False)
async def serveAndroidIcon():
    return FileResponse("../frontend/dist/android-chrome-192x192.png")

# Catch-all route for SPA - must be last
@app.get("/{full_path:path}", include_in_schema=False)
async def catch_all(full_path: str):
    if not full_path.startswith("api/"):
        return FileResponse(
            path="../frontend/dist/index.html",
            media_type="text/html")
    raise HTTPException(status_code=404, detail="Not found")
