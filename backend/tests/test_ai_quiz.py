from fastapi.testclient import TestClient
from app.main import app
import os
from dotenv import load_dotenv

load_dotenv()

client = TestClient(app)

def test_generate_quiz_fix():
    # Mock data structure matching GenerateQuizRequest
    mnemonic_data = {
        "topic": "Test Topic",
        "facts": ["Fact 1", "Fact 2"],
        "story": "A story about facts",
        "associations": [
            {"medicalTerm": "Term 1", "character": "Char 1", "explanation": "Exp 1"},
            {"medicalTerm": "Term 2", "character": "Char 2", "explanation": "Exp 2"}
        ],
        "visualPrompt": "A visual prompt"
    }
    
    response = client.post("/api/ai/generate/quiz", json={
        "mnemonicData": mnemonic_data,
        "language": "en"
    })
    
    if response.status_code != 200:
        print(f"Error: {response.json()}")
        
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) > 0
    assert "question" in questions[0]
    assert "options" in questions[0]
