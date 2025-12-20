import pytest
from httpx import AsyncClient

# Helper to get auth headers
async def get_auth_headers(client, username="storyuser"):
    # Register
    await client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "password"
        }
    )
    # Login
    res = await client.post(
        "/api/auth/token",
        data={"username": username, "password": "password"}
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_and_get_story(client: AsyncClient):
    headers = await get_auth_headers(client, "create")
    
    story_payload = {
        "id": "manual-id-1",
        "topic": "Antibiotics",
        "facts": ["Fact 1", "Fact 2"],
        "story": "Once upon a time...",
        "associations": [
            {
                "medicalTerm": "Term1",
                "character": "Char1",
                "explanation": "Exp1",
                "srs": None
            }
        ],
        "visualPrompt": "Draw a...",
        "createdAt": 123456789
    }
    
    # Create
    res = await client.post("/api/stories", json=story_payload, headers=headers)
    assert res.status_code == 201
    assert res.json()["id"] == "manual-id-1"
    
    # Get List
    res = await client.get("/api/stories", headers=headers)
    assert res.status_code == 200
    stories = res.json()
    assert len(stories) == 1
    assert stories[0]["topic"] == "Antibiotics"

@pytest.mark.asyncio
async def test_srs_review(client: AsyncClient):
    headers = await get_auth_headers(client, "srs")
    
    # Create story with 1 association
    story_payload = {
        "id": "srs-story",
        "topic": "SRS Topic",
        "facts": ["F1"],
        "story": "S1",
        "associations": [
            {
                "medicalTerm": "T1",
                "character": "C1",
                "explanation": "E1",
                "srs": None 
            }
        ],
        "visualPrompt": "VP",
        "createdAt": 1000
    }
    await client.post("/api/stories", json=story_payload, headers=headers)
    
    # Review with quality 5 (Perfect)
    # Association index 0
    review_payload = {
        "associationIndex": 0,
        "quality": 5
    }
    
    res = await client.post("/api/stories/srs-story/review", json=review_payload, headers=headers)
    assert res.status_code == 200
    updated_story = res.json()
    
    assoc = updated_story["associations"][0]
    assert assoc["srs"] is not None
    assert assoc["srs"]["n"] == 1 # First review
    assert assoc["srs"]["i"] == 1 # First interval for n=1 (implied from logic: if quality>=3: if n==0: i=1)
    # Logic verification: quality=5. 
    # n=0 -> i=1. n becomes 1.
    # ef starts 2.5. updated: 2.5 + (0.1 - (0) * ...) = 2.6
    assert abs(assoc["srs"]["ef"] - 2.6) < 0.01

@pytest.mark.asyncio
async def test_delete_story(client: AsyncClient):
    headers = await get_auth_headers(client, "delete")
    story_payload = {
        "id": "del-story",
        "topic": "T",
        "facts": [],
        "story": "S",
        "associations": [],
        "visualPrompt": "V",
        "createdAt": 1
    }
    await client.post("/api/stories", json=story_payload, headers=headers)
    
    # Delete
    res = await client.delete("/api/stories/del-story", headers=headers)
    assert res.status_code == 204
    
    # Verify gone
    res = await client.get("/api/stories/del-story", headers=headers)
    assert res.status_code == 404
