#!/usr/bin/env python3
"""Backfill thumbnails for existing plants.

Run after migrating DB (alembic upgrade head):

    python scripts/backfill_thumbnails.py

This script imports from the application package; it adds the `backend` folder
to `sys.path` so the `app` package can be loaded when run from the repository
root.
"""
import sys
import asyncio
from pathlib import Path

# Ensure the backend folder is importable as a package root
REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_PATH = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_PATH))

from app.database.setup import async_session_maker
from app.database.models import PlantDB
from app.utils import create_thumbnail
from sqlalchemy import select, update


essent = "Starting thumbnail backfill"
print(essent)

async def backfill(batch_size: int = 50):
    async with async_session_maker() as session:
        stmt = select(PlantDB.id, PlantDB.image).where(PlantDB.image != None)
        result = await session.execute(stmt)
        rows = result.fetchall()
        total = len(rows)
        print(f"Found {total} plants with images to process")

        count = 0
        for plant_id, image_data in rows:
            try:
                if not image_data:
                    continue
                # Generate thumbnail in thread to avoid blocking event loop
                thumb = await asyncio.to_thread(create_thumbnail, image_data)
                await session.execute(
                    update(PlantDB).where(PlantDB.id == plant_id).values(thumbnail=thumb)
                )
                await session.commit()
                count += 1
                if count % batch_size == 0:
                    print(f"Backfilled {count}/{total} thumbnails...")
            except Exception as exc:
                print(f"Failed to backfill {plant_id}: {exc}")
        print(f"Done — generated {count} thumbnails")

if __name__ == '__main__':
    asyncio.run(backfill())
