import pytest
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timedelta

from app.main import app
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.database.setup import Base

pytestmark = pytest.mark.asyncio

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except:
            await session.rollback()
            raise

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

async def test_get_plants_empty(async_client: AsyncClient):
    response = await async_client.get("/api/plants")
    assert response.status_code == 200
    assert response.json() == []

async def test_add_and_water_bulk(async_client: AsyncClient):
    # Add two plants
    plant1_id = str(uuid4())
    plant1 = {
        "id": plant1_id,
        "name": "Fern",
        "species": "Boston Fern",
        "watering_interval": 7,
        "last_watered": (datetime.now() - timedelta(days=10)).isoformat(),
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    }
    plant2_id = str(uuid4())
    plant2 = {
        "id": plant2_id,
        "name": "Cactus",
        "species": "Saguaro",
        "watering_interval": 30,
        "last_watered": (datetime.now() - timedelta(days=40)).isoformat(),
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    }
    
    # Use PUT to add plants
    res1 = await async_client.put("/api/plants", json=plant1)
    assert res1.status_code == 200
    res2 = await async_client.put("/api/plants", json=plant2)
    assert res2.status_code == 200
    
    # Bulk water them
    response = await async_client.post("/api/plants/water-all", json={"plant_ids": [plant1_id, plant2_id]})
    assert response.status_code == 200
    assert "Successfully watered 2 plants" in response.json()["message"]
    
    # Verify they were updated
    response = await async_client.get("/api/plants")
    plants = response.json()
    assert len(plants) == 2
    for p in plants:
        last_watered = datetime.fromisoformat(p["last_watered"])
        # Use UTC or local offset awareness if needed, but for local test this should be okay
        assert last_watered > datetime.now() - timedelta(minutes=5)
