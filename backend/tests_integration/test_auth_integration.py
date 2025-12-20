import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "strongpassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    # Register first
    await client.post(
        "/auth/register",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "mypassword"
        }
    )
    
    # Login
    response = await client.post(
        "/auth/token",
        data={
            "username": "loginuser",
            "password": "mypassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_get_current_user_me(client: AsyncClient):
    # Register
    await client.post(
        "/auth/register",
        json={
            "username": "meuser",
            "email": "me@example.com",
            "password": "mypassword"
        }
    )
    
    # Login to get token
    login_res = await client.post(
        "/auth/token",
        data={
            "username": "meuser",
            "password": "mypassword"
        }
    )
    token = login_res.json()["access_token"]
    
    # Get Me
    response = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "meuser"
    assert data["email"] == "me@example.com"
