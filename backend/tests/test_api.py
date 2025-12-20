from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to MedMnemonic API"}

def test_auth_and_stories_flow():
    # 1. Register
    username = f"user_{uuid.uuid4()}"
    password = "testpassword"
    email = f"{username}@example.com"
    
    response = client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    assert response.status_code == 201
    user_id = response.json()["id"]

    # 2. Login
    response = client.post("/auth/token", data={
        "username": username,
        "password": password
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get User Profile
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == username

    # 4. Create Story
    story_data = {
        "id": "story_1",
        "topic": "Test Topic",
        "facts": ["Fact A"],
        "story": "Once upon a time",
        "associations": [
            {"medicalTerm": "Term A", "character": "Char A", "explanation": "Exp A"}
        ],
        "visualPrompt": "A picture",
        "createdAt": 1234567890
    }
    response = client.post("/stories", json=story_data, headers=headers)
    if response.status_code != 201:
        print(f"Create Story Failed: {response.json()}")
    assert response.status_code == 201
    
    # 5. Get Stories
    response = client.get("/stories", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["topic"] == "Test Topic"
    
    # 6. Submit Review (SRS)
    review_data = {"associationIndex": 0, "quality": 4} # Good
    response = client.post("/stories/story_1/review", json=review_data, headers=headers)
    assert response.status_code == 200
    updated_story = response.json()
    assert updated_story["associations"][0]["srs"]["n"] == 1 # First success

    # 7. Mock AI endpoints
    response = client.post("/ai/generate/mnemonic", json={"text": "flu symptoms"})
    assert response.status_code == 200
    assert "associations" in response.json()

    # 8. Delete Story
    response = client.delete("/stories/story_1", headers=headers)
    assert response.status_code == 204
    
    response = client.get("/stories", headers=headers)
    assert len(response.json()) == 0
