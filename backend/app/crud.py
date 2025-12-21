from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, delete, select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from . import sql_models, models
import time

async def create_user(session: AsyncSession, user_data: dict) -> sql_models.User:
    # Check if user exists (username)
    existing_user = await get_user_by_username(session, user_data['username'])
    if existing_user:
        raise ValueError("Username already exists")

    # Check if user exists (email)
    existing_email = await get_user_by_email(session, user_data['email'])
    if existing_email:
        raise ValueError("Email already registered")

    new_user = sql_models.User(**user_data)
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return new_user

async def get_user_by_username(session: AsyncSession, username: str) -> Optional[sql_models.User]:
    result = await session.execute(select(sql_models.User).where(sql_models.User.username == username))
    return result.scalars().first()

async def get_user_by_email(session: AsyncSession, email: str) -> Optional[sql_models.User]:
    result = await session.execute(select(sql_models.User).where(sql_models.User.email == email))
    return result.scalars().first()

async def get_stories(session: AsyncSession, user_id: str) -> List[sql_models.SavedStory]:
    result = await session.execute(select(sql_models.SavedStory).where(sql_models.SavedStory.user_id == user_id))
    return list(result.scalars().all())

async def create_story(session: AsyncSession, user_id: str, story_data: models.SavedStory) -> sql_models.SavedStory:
    # Convert Pydantic model to dict, exclude 'id' to let DB/Model generate it or use provided one?
    # The Pydantic model "SavedStory" has an ID.
    # If the user provides an ID, we use it. If not, we generate.
    # However, the previous mock DB just stored what was passed.
    
    story_dict = story_data.model_dump()
    # Check if 'srs' is in associations or flattened.
    # In Pydantic model, 'associations' has 'srs'.
    # Our SQL model stores 'associations' as JSON, so it preserves structure.
    
    # We need to manually handle the bidirectional relationship or just set IDs.
    # Setting user_id is enough.
    
    # Check if story exists?
    # Just add.
    
    db_story = sql_models.SavedStory(**story_dict, user_id=user_id)
    session.add(db_story)
    await session.commit()
    await session.refresh(db_story)
    return db_story

async def get_story(session: AsyncSession, user_id: str, story_id: str) -> Optional[sql_models.SavedStory]:
    result = await session.execute(
        select(sql_models.SavedStory).where(
            sql_models.SavedStory.user_id == user_id,
            sql_models.SavedStory.id == story_id
        )
    )
    return result.scalars().first()

async def update_story(session: AsyncSession, user_id: str, story_id: str, updated_story: models.SavedStory) -> Optional[sql_models.SavedStory]:
    # Check existence
    db_story = await get_story(session, user_id, story_id)
    if not db_story:
        return None
    
    # Update fields
    story_data = updated_story.model_dump()
    # Exclude id and user_id from update if necessary, but here we just overwrite
    
    for key, value in story_data.items():
        if key != "id" and key != "user_id":
             setattr(db_story, key, value)
    
    session.add(db_story)
    await session.commit()
    await session.refresh(db_story)
    return db_story

async def delete_story(session: AsyncSession, user_id: str, story_id: str) -> bool:
    db_story = await get_story(session, user_id, story_id)
    if not db_story:
        return False
    
    session.delete(db_story)
    await session.commit()
    return True

# --- Playlist CRUD ---

async def get_playlists(session: AsyncSession, user_id: str) -> List[sql_models.Playlist]:
    result = await session.execute(
        select(sql_models.Playlist)
        .where(sql_models.Playlist.user_id == user_id)
        .options(selectinload(sql_models.Playlist.stories))
    )
    return list(result.scalars().all())

async def get_playlist(session: AsyncSession, user_id: str, playlist_id: str) -> Optional[sql_models.Playlist]:
    result = await session.execute(
        select(sql_models.Playlist)
        .where(
            sql_models.Playlist.id == playlist_id,
            sql_models.Playlist.user_id == user_id
        )
        .options(selectinload(sql_models.Playlist.stories))
    )
    return result.scalars().first()

async def create_playlist(session: AsyncSession, user_id: str, playlist_in: models.PlaylistCreate) -> sql_models.Playlist:
    db_playlist = sql_models.Playlist(
        **playlist_in.model_dump(),
        user_id=user_id,
        createdAt=int(time.time() * 1000)
    )
    session.add(db_playlist)
    await session.commit()
    await session.refresh(db_playlist)
    return db_playlist

async def delete_playlist(session: AsyncSession, user_id: str, playlist_id: str) -> bool:
    db_playlist = await get_playlist(session, user_id, playlist_id)
    if not db_playlist:
        return False
    
    await session.delete(db_playlist)
    await session.commit()
    return True

async def add_story_to_playlist(session: AsyncSession, user_id: str, playlist_id: str, story_id: str) -> bool:
    playlist = await get_playlist(session, user_id, playlist_id)
    if not playlist:
        return False
    
    story = await get_story(session, user_id, story_id)
    if not story:
        return False
    
    if story not in playlist.stories:
        playlist.stories.append(story)
        await session.commit()
    return True

async def remove_story_from_playlist(session: AsyncSession, user_id: str, playlist_id: str, story_id: str) -> bool:
    playlist = await get_playlist(session, user_id, playlist_id)
    if not playlist:
        return False
    
    # Filter out the story
    playlist.stories = [s for s in playlist.stories if s.id != story_id]
    await session.commit()
    return True

