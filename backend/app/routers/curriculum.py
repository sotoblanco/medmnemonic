from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import crud, models, sql_models, auth
from ..database import get_db

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])

@router.get("/topics", response_model=List[models.Topic])
async def get_topics(db: AsyncSession = Depends(get_db)):
    return await crud.get_topics(db)

@router.get("/topics/{topic_id}", response_model=models.Topic)
async def get_topic(topic_id: str, db: AsyncSession = Depends(get_db)):
    db_topic = await crud.get_topic(db, topic_id)
    if not db_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return db_topic

@router.get("/concepts/{concept_id}", response_model=models.Concept)
async def get_concept(concept_id: str, db: AsyncSession = Depends(get_db)):
    db_concept = await crud.get_concept(db, concept_id)
    if not db_concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    return db_concept

@router.get("/concepts/{concept_id}/public_mnemonic", response_model=models.SavedStory)
async def get_public_mnemonic(concept_id: str, db: AsyncSession = Depends(get_db)):
    # Fetch a story linked to this concept and created by an admin
    # We first find admins then search
    # Or cleaner: join User table
    from sqlalchemy import select
    
    stmt = (
        select(sql_models.SavedStory)
        .join(sql_models.User)
        .where(
            sql_models.SavedStory.concept_id == concept_id,
            sql_models.User.is_admin == True
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    public_story = result.scalars().first()
    
    if not public_story:
         raise HTTPException(status_code=404, detail="No public mnemonic found for this concept")
    return public_story


@router.post("/progress", response_model=models.UserProgress)
async def update_progress(progress: models.UserProgressBase, db: AsyncSession = Depends(get_db), user: sql_models.User = Depends(auth.get_current_user)):
    return await crud.update_user_progress(db, user.id, progress)

@router.get("/progress", response_model=List[models.UserProgress])
async def get_all_progress(db: AsyncSession = Depends(get_db), user: sql_models.User = Depends(auth.get_current_user)):
    return await crud.get_all_user_progress(db, user.id)
