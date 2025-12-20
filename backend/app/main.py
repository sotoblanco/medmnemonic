from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from .routers import auth, stories, ai
from .database import engine, Base
from . import sql_models # Register models
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="MedMnemonic API",
    description="Backend API for the MedMnemonic application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS (Allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(stories.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

# Serve React App
static_path = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(static_path):
    # Mount assets (Vite specific)
    assets_path = os.path.join(static_path, "assets")
    if os.path.isdir(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        file_path = os.path.join(static_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse(os.path.join(static_path, "index.html"))
