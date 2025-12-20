import modal
import os

app = modal.App("medmnemonic")

# Define the image with necessary dependencies
# Using versions from pyproject.toml to ensure compatibility
image = (
    modal.Image.debian_slim()
    .pip_install(
        "fastapi>=0.125.0",
        "uvicorn>=0.38.0",
        "sqlalchemy>=2.0.45",
        "aiosqlite>=0.22.0",
        "asyncpg>=0.31.0",
        "bcrypt==4.0.1",
        "email-validator>=2.3.0",
        "google-genai>=1.56.0",
        "greenlet>=3.3.0",
        "httpx>=0.28.1",
        "passlib[bcrypt]>=1.7.4",
        "pydantic>=2.12.5",
        "python-dotenv>=1.2.1",
        "python-jose[cryptography]>=3.5.0",
        "python-multipart>=0.0.21"
    )
    .add_local_dir("app", remote_path="/root/app")
)

# Define a persistent volume for the database
volume = modal.Volume.from_name("medmnemonic-data", create_if_missing=True)

@app.function(
    image=image,
    # Mount the volume to /data
    volumes={"/data": volume},
    # Load secrets from local .env file (e.g. GEMINI_API_KEY)
    secrets=[modal.Secret.from_dotenv()],
    # Set the DATABASE_URL to use the persistent volume
    # 4 slashes for absolute path: sqlite+aiosqlite:////data/medmnemonic.db
    env={"DATABASE_URL": "sqlite+aiosqlite:////data/medmnemonic.db"}
)
@modal.asgi_app()
def fastapi_app():
    from app.main import app as web_app
    return web_app
