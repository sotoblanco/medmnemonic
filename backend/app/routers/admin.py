from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import crud, models, sql_models, auth
from ..database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])

async def get_current_admin(user: sql_models.User = Depends(auth.get_current_user)):
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return user

@router.post("/topics", response_model=models.Topic)
async def create_topic(topic: models.TopicCreate, db: AsyncSession = Depends(get_db), admin = Depends(get_current_admin)):
    return await crud.create_topic(db, topic)

@router.put("/topics/{topic_id}", response_model=models.Topic)
async def update_topic(topic_id: str, topic: models.TopicBase, db: AsyncSession = Depends(get_db), admin = Depends(get_current_admin)):
    db_topic = await crud.update_topic(db, topic_id, topic)
    if not db_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return db_topic

@router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str, db: AsyncSession = Depends(get_db), admin = Depends(get_current_admin)):
    success = await crud.delete_topic(db, topic_id)
    if not success:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"message": "Topic deleted"}

@router.post("/concepts", response_model=models.Concept)
async def create_concept(concept: models.ConceptCreate, db: AsyncSession = Depends(get_db), admin = Depends(get_current_admin)):
    return await crud.create_concept(db, concept)

@router.put("/concepts/{concept_id}", response_model=models.Concept)
async def update_concept(concept_id: str, concept: models.ConceptBase, db: AsyncSession = Depends(get_db), admin = Depends(get_current_admin)):
    db_concept = await crud.update_concept(db, concept_id, concept)
    if not db_concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    return db_concept

@router.delete("/concepts/{concept_id}")
async def delete_concept(concept_id: str, db: AsyncSession = Depends(get_db), admin = Depends(get_current_admin)):
    success = await crud.delete_concept(db, concept_id)
    if not success:
        raise HTTPException(status_code=404, detail="Concept not found")
    return {"message": "Concept deleted"}
