import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

api_key = os.environ.get("GEMINI_API_KEY")
print(f"DEBUG: API Key present: {bool(api_key)}")
print(f"DEBUG: API Key length: {len(api_key) if api_key else 0}")

client = genai.Client(api_key=api_key)

if __name__ == "__main__":
    system_instruction = "You are a helpful creative assistant."
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Hello, suggest a mnemonic for verifying things.")])
    ]

    print("DEBUG: Sending request...")
    try:
        # Replicating admin.py call
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=contents,
            config=types.GenerateContentConfig(
                 system_instruction=system_instruction,
                 thinking_config=types.ThinkingConfig(thinking_level="high")
            )
        )
        print("DEBUG: Response received!")
        print(response.text)
    except Exception as e:
        print(f"ERROR: {e}")
