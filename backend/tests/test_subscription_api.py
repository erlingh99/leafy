from uuid import uuid4

SUBSCRIPTION_PAYLOAD = {
    "name": "Jane Doe",
    "email": "jane@example.com",
}


async def _create_and_get_id(client) -> str:
    await client.put("/api/subscriptions", json=SUBSCRIPTION_PAYLOAD)
    all_resp = await client.get("/api/subscriptions")
    return all_resp.json()[0]["id"]


async def test_get_subscriptions_empty(client):
    response = await client.get("/api/subscriptions")
    assert response.status_code == 200
    assert response.json() == []


async def test_create_subscription(client):
    response = await client.put("/api/subscriptions", json=SUBSCRIPTION_PAYLOAD)
    assert response.status_code == 200


async def test_get_subscriptions_after_create(client):
    await client.put("/api/subscriptions", json=SUBSCRIPTION_PAYLOAD)
    response = await client.get("/api/subscriptions")
    assert response.status_code == 200
    subs = response.json()
    assert len(subs) == 1
    assert subs[0]["email"] == "jane@example.com"


async def test_get_subscription_by_id(client):
    sub_id = await _create_and_get_id(client)

    response = await client.get(f"/api/subscriptions/{sub_id}")
    assert response.status_code == 200
    assert response.json()["email"] == "jane@example.com"
    assert response.json()["name"] == "Jane Doe"


async def test_get_subscription_not_found(client):
    response = await client.get(f"/api/subscriptions/{uuid4()}")
    assert response.status_code == 404


async def test_delete_subscription(client):
    sub_id = await _create_and_get_id(client)

    assert (await client.delete(f"/api/subscriptions/{sub_id}")).status_code == 200
    assert (await client.get(f"/api/subscriptions/{sub_id}")).status_code == 404


async def test_update_subscription_name(client):
    sub_id = await _create_and_get_id(client)

    patch_resp = await client.patch(
        f"/api/subscriptions/{sub_id}",
        json={"name": "Jane Smith"},
    )
    assert patch_resp.status_code == 200

    get_resp = await client.get(f"/api/subscriptions/{sub_id}")
    assert get_resp.json()["name"] == "Jane Smith"
    assert get_resp.json()["email"] == "jane@example.com"


async def test_update_subscription_not_found(client):
    response = await client.patch(
        f"/api/subscriptions/{uuid4()}", json={"name": "Ghost"}
    )
    assert response.status_code == 404


async def test_invalid_email_rejected(client):
    response = await client.put(
        "/api/subscriptions",
        json={"name": "Bad Email", "email": "not-an-email"},
    )
    assert response.status_code == 422
