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

@router.post("/progress", response_model=models.UserProgress)
async def update_progress(progress: models.UserProgressBase, db: AsyncSession = Depends(get_db), user: sql_models.User = Depends(auth.get_current_user)):
    return await crud.update_user_progress(db, user.id, progress)

@router.get("/progress", response_model=List[models.UserProgress])
async def get_all_progress(db: AsyncSession = Depends(get_db), user: sql_models.User = Depends(auth.get_current_user)):
    return await crud.get_all_user_progress(db, user.id)
