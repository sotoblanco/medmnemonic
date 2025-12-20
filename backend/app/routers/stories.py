from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import SavedStory, ReviewRequest, MnemonicAssociation, SRSMetadata, User
from ..database import get_db
from .. import crud
from ..auth import get_current_user
import time

router = APIRouter(prefix="/stories", tags=["Stories"])

@router.get("", response_model=List[SavedStory])
async def get_stories(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    return await crud.get_stories(session, current_user.id)

@router.post("", response_model=SavedStory, status_code=status.HTTP_201_CREATED)
async def create_story(story: SavedStory, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    return await crud.create_story(session, current_user.id, story)

@router.get("/{id}", response_model=SavedStory)
async def get_story(id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    story = await crud.get_story(session, current_user.id, id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story

@router.put("/{id}", response_model=SavedStory)
async def update_story(id: str, story: SavedStory, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    if story.id != id:
        raise HTTPException(status_code=400, detail="ID mismatch")
    
    updated = await crud.update_story(session, current_user.id, id, story)
    if not updated:
        raise HTTPException(status_code=404, detail="Story not found")
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story(id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    success = await crud.delete_story(session, current_user.id, id)
    if not success:
        raise HTTPException(status_code=404, detail="Story not found")
    return

@router.post("/{id}/review", response_model=SavedStory)
async def review_story_association(
    id: str, 
    review: ReviewRequest, 
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    db_story = await crud.get_story(session, current_user.id, id)
    if not db_story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Parse associations from JSON (dict) to Pydantic models for manipulation
    try:
        # db_story.associations is a list of dicts
        associations_objs = [MnemonicAssociation(**a) for a in db_story.associations]
        association = associations_objs[review.associationIndex]
    except (IndexError, TypeError):
        raise HTTPException(status_code=400, detail="Association index out of bounds or invalid data")

    # Initial state or existing
    if association.srs is None:
        n, ef, i = 0, 2.5, 0
    else:
        n, ef, i = association.srs.n, association.srs.ef, association.srs.i

    quality = review.quality
    
    if quality >= 3:
        if n == 0:
            i = 1
        elif n == 1:
            i = 6
        else:
            i = int(round(i * ef))
        n += 1
    else:
        n = 0
        i = 1
    
    # Update EF
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if ef < 1.3:
        ef = 1.3
        
    now_ms = int(time.time() * 1000)
    # i is in days, convert to ms
    next_review_ms = now_ms + (i * 24 * 60 * 60 * 1000)
    
    new_srs = {
        "n": n,
        "ef": ef,
        "i": i,
        "lastReview": now_ms,
        "nextReview": next_review_ms
    }
    
    # Update object
    association.srs = SRSMetadata(**new_srs)
    associations_objs[review.associationIndex] = association
    
    # Save back to DB (Convert back to dicts)
    # IMPORTANT: We must re-assign the list to trigger mutation detection in SQLAlchemy or explicitly flag modified
    db_story.associations = [a.model_dump() for a in associations_objs]
    
    session.add(db_story)
    await session.commit()
    await session.refresh(db_story)
    
    return db_story
