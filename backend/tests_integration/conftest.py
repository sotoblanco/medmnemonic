import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.database import Base, get_db
from app.auth import create_access_token

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="function")
async def db_session():
    # Create engine and tables
    # check_same_thread=False is needed for SQLite + asyncio
    engine = create_async_engine(
        TEST_DATABASE_URL, 
        connect_args={"check_same_thread": False},
        poolclass=None # NullPool is safer for :memory: to ensure it closes? Or default is fine?
        # Actually with :memory:, if connection closes, DB is lost. 
        # We need the engine to hold a connection or we re-create every time.
        # But we want a fresh DB per test, so creating new engine per test is fine.
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestingSessionLocal = async_sessionmaker(
        autocommit=False, autoflush=False, expire_on_commit=False, bind=engine
    )

    async with TestingSessionLocal() as session:
        yield session
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    # Helper to generate headers for a fake user
    # We might need to insert the user into DB first because the API checks existence
    return None # Will define in tests or explicit helper fixture
