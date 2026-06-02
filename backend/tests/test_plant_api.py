from uuid import uuid4


PLANT_PAYLOAD = {
    "name": "My Fern",
    "species": "Boston Fern",
    "watering_interval": 7,
    "last_watered": "2024-01-01T00:00:00Z",
}


async def test_get_plants_empty(client):
    response = await client.get("/api/plants")
    assert response.status_code == 200
    assert response.json() == []


async def test_create_plant_returns_response(client):
    response = await client.put("/api/plants", json=PLANT_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Fern"
    assert data["species"] == "Boston Fern"
    assert data["watering_interval"] == 7
    assert data["image_url"] is None
    assert data["thumbnail_url"] is None
    assert "id" in data


async def test_get_plants_after_create(client):
    await client.put("/api/plants", json=PLANT_PAYLOAD)
    response = await client.get("/api/plants")
    assert response.status_code == 200
    plants = response.json()
    assert len(plants) == 1
    assert plants[0]["name"] == "My Fern"


async def test_get_plant_by_id(client):
    create_resp = await client.put("/api/plants", json=PLANT_PAYLOAD)
    plant_id = create_resp.json()["id"]

    response = await client.get(f"/api/plants/{plant_id}")
    assert response.status_code == 200
    assert response.json()["id"] == plant_id


async def test_get_plant_not_found(client):
    response = await client.get(f"/api/plants/{uuid4()}")
    assert response.status_code == 404


async def test_delete_plant(client):
    create_resp = await client.put("/api/plants", json=PLANT_PAYLOAD)
    plant_id = create_resp.json()["id"]

    assert (await client.delete(f"/api/plants/{plant_id}")).status_code == 200
    assert (await client.get(f"/api/plants/{plant_id}")).status_code == 404


async def test_update_plant(client):
    create_resp = await client.put("/api/plants", json=PLANT_PAYLOAD)
    plant_id = create_resp.json()["id"]

    patch_resp = await client.patch(
        f"/api/plants/{plant_id}",
        json={"name": "Updated Fern", "watering_interval": 14},
    )
    assert patch_resp.status_code == 200
    data = patch_resp.json()
    assert data["name"] == "Updated Fern"
    assert data["watering_interval"] == 14


async def test_update_plant_not_found(client):
    response = await client.patch(f"/api/plants/{uuid4()}", json={"name": "Ghost"})
    assert response.status_code == 404


async def test_update_plant_species_triggers_enrichment_attempt(client):
    create_resp = await client.put("/api/plants", json=PLANT_PAYLOAD)
    plant_id = create_resp.json()["id"]

    # Patching species will launch background enrichment; with no API key it fails
    # gracefully — the important thing is the endpoint returns 200.
    patch_resp = await client.patch(
        f"/api/plants/{plant_id}",
        json={"species": "Monstera deliciosa"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["species"] == "Monstera deliciosa"


async def test_water_plant(client):
    create_resp = await client.put("/api/plants", json=PLANT_PAYLOAD)
    plant_id = create_resp.json()["id"]

    response = await client.post(f"/api/plants/water/{plant_id}")
    assert response.status_code == 200


async def test_water_plant_not_found(client):
    response = await client.post(f"/api/plants/water/{uuid4()}")
    assert response.status_code == 404


async def test_water_all_plants(client):
    await client.put("/api/plants", json=PLANT_PAYLOAD)
    await client.put("/api/plants", json={**PLANT_PAYLOAD, "name": "Second Plant"})

    response = await client.post("/api/plants/water/all")
    assert response.status_code == 200


async def test_get_image_not_found(client):
    create_resp = await client.put("/api/plants", json=PLANT_PAYLOAD)
    plant_id = create_resp.json()["id"]

    response = await client.get(f"/api/plants/{plant_id}/image")
    assert response.status_code == 404


async def test_get_thumbnail_not_found(client):
    create_resp = await client.put("/api/plants", json=PLANT_PAYLOAD)
    plant_id = create_resp.json()["id"]

    response = await client.get(f"/api/plants/{plant_id}/thumbnail")
    assert response.status_code == 404


async def test_get_species_not_found(client):
    response = await client.get("/api/plants/species/99999")
    assert response.status_code == 404


async def test_watering_interval_validation(client):
    response = await client.put(
        "/api/plants", json={**PLANT_PAYLOAD, "watering_interval": 0}
    )
    assert response.status_code == 422

    response = await client.put(
        "/api/plants", json={**PLANT_PAYLOAD, "watering_interval": 366}
    )
    assert response.status_code == 422


async def test_multiple_plants_listed(client):
    await client.put("/api/plants", json=PLANT_PAYLOAD)
    await client.put("/api/plants", json={**PLANT_PAYLOAD, "name": "Cactus"})
    await client.put("/api/plants", json={**PLANT_PAYLOAD, "name": "Orchid"})

    response = await client.get("/api/plants")
    assert len(response.json()) == 3
