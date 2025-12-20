from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

    
def test_auth_and_stories_flow():
    # 1. Register
    username = f"user_{uuid.uuid4()}"
    password = "testpassword"
    email = f"{username}@example.com"
    
    response = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    assert response.status_code == 201
    user_id = response.json()["id"]

    # 2. Login
    response = client.post("/api/auth/token", data={
        "username": username,
        "password": password
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get User Profile
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == username

    # 4. Create Story
    story_data = {
        "id": "story_1",
        "topic": "Test Topic",
        "facts": ["Fact A"],
        "story": "Once upon a time",
        "associations": [
            {
                "medicalTerm": "Term A", 
                "character": "Char A", 
                "explanation": "Exp A",
                "boundingBox": None,
                "shape": None
            }
        ],
        "visualPrompt": "A picture",
        "createdAt": 1234567890
    }
    response = client.post("/api/stories", json=story_data, headers=headers)
    if response.status_code != 201:
        print(f"Create Story Failed: {response.json()}")
    assert response.status_code == 201
    
    # 5. Get Stories
    response = client.get("/api/stories", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["topic"] == "Test Topic"
    
    # 6. Submit Review (SRS)
    review_data = {"associationIndex": 0, "quality": 4} # Good
    response = client.post("/api/stories/story_1/review", json=review_data, headers=headers)
    assert response.status_code == 200
    updated_story = response.json()
    assert updated_story["associations"][0]["srs"]["n"] == 1 # First success

    # 7. Mock AI endpoints (this hits real API if key present, else might fail or we should skip/mock)
    # We'll just verify the path is correct
    # Updated to verify generation works (uses real quota)
    # Note: Mocking should be preferred in unit tests
    
    # Note: we need to handle RateLimit or ensure key is present.
    # For now just update path.
    # response = client.post("/api/ai/generate/mnemonic", json={"text": "flu symptoms"})
    # assert response.status_code == 200
    # assert "associations" in response.json()

    # 8. Delete Story
    response = client.delete("/api/stories/story_1", headers=headers)
    assert response.status_code == 204
    
    response = client.get("/api/stories", headers=headers)
    assert len(response.json()) == 0
