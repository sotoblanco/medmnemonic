
import modal
import sys
import os

# Connect to the same volume and image as the main app
volume = modal.Volume.from_name("medmnemonic-data", create_if_missing=True)

image = (
    modal.Image.debian_slim()
    .pip_install("sqlalchemy", "aiosqlite")
    .env({"DATABASE_URL": "sqlite+aiosqlite:////data/medmnemonic.db"})
)

app = modal.App("medmnemonic-admin-tools")

@app.function(image=image, volumes={"/data": volume})
async def promote_user(username: str):
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text
    
    engine = create_async_engine("sqlite+aiosqlite:////data/medmnemonic.db")
    
    async with engine.begin() as conn:
        print(f"Searching for user: {username}")
        # Check if user exists
        result = await conn.execute(text("SELECT id, is_admin FROM users WHERE username = :u"), {"u": username})
        row = result.fetchone()
        
        if not row:
            print(f"User '{username}' not found!")
            return
            
        if row.is_admin:
            print(f"User '{username}' is already an admin.")
            return

        # Update
        await conn.execute(text("UPDATE users SET is_admin = 1 WHERE username = :u"), {"u": username})
        print(f"SUCCESS: User '{username}' has been promoted to Admin.")

@app.local_entrypoint()
def main(username: str):
    promote_user.remote(username)
