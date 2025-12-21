from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import Playlist, PlaylistCreate, User
from ..database import get_db
from .. import crud
from ..auth import get_current_user

router = APIRouter(prefix="/playlists", tags=["Playlists"])

@router.get("", response_model=List[Playlist])
async def list_playlists(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    db_playlists = await crud.get_playlists(session, current_user.id)
    results = []
    for p in db_playlists:
        res = Playlist.model_validate(p)
        res.story_ids = [s.id for s in p.stories]
        results.append(res)
    return results

@router.post("", response_model=Playlist)
async def create_playlist(playlist_in: PlaylistCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    p = await crud.create_playlist(session, current_user.id, playlist_in)
    res = Playlist.model_validate(p)
    res.story_ids = []
    return res

@router.get("/{id}", response_model=Playlist)
async def get_playlist(id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    p = await crud.get_playlist(session, current_user.id, id)
    if not p:
        raise HTTPException(status_code=404, detail="Playlist not found")
    res = Playlist.model_validate(p)
    res.story_ids = [s.id for s in p.stories]
    return res

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    success = await crud.delete_playlist(session, current_user.id, id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return

@router.post("/{id}/stories/{story_id}", status_code=status.HTTP_200_OK)
async def add_to_playlist(id: str, story_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    success = await crud.add_story_to_playlist(session, current_user.id, id, story_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist or Story not found")
    return {"status": "success"}

@router.delete("/{id}/stories/{story_id}", status_code=status.HTTP_200_OK)
async def remove_from_playlist(id: str, story_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    success = await crud.remove_story_from_playlist(session, current_user.id, id, story_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "success"}
