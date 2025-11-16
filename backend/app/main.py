from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.gzip import GZipMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv

import os
import logging
from contextlib import asynccontextmanager
from .routes import plant_api, subscription_api
from .database import init_db
from .subscription import send_email

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.debug("Initializing...")
    load_dotenv()
    API_KEY = os.getenv("BREVO_API_KEY")
    await init_db()
    if (API_KEY):
        scheduler = BackgroundScheduler()
        scheduler.add_job(lambda: send_email(API_KEY), "cron", hour=12, minute=0)
        scheduler.start()
        logger.debug("Email reminders activated")
    else:
        logger.debug("No API key found, skipping email")
    logger.debug("Initialized")
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size = 1000, compresslevel=5) # ty: ignore[invalid-argument-type]

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
