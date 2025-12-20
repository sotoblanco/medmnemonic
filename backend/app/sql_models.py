from sqlalchemy import Column, String, Text, Integer, JSON, ForeignKey, BigInteger
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, Optional, Any
from .database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    
    # Relationship to stories
    stories: Mapped[List["SavedStory"]] = relationship("SavedStory", back_populates="user", cascade="all, delete-orphan")

class SavedStory(Base):
    __tablename__ = "saved_stories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    
    topic: Mapped[str] = mapped_column(String)
    facts: Mapped[List[str]] = mapped_column(JSON) # Storing List[str]
    story: Mapped[str] = mapped_column(Text)
    associations: Mapped[List[Any]] = mapped_column(JSON) # Storing List[MnemonicAssociation] objects
    visualPrompt: Mapped[str] = mapped_column(Text)
    imageData: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[int] = mapped_column(BigInteger) # Using BigInt for timestamp (ms)

    user: Mapped["User"] = relationship("User", back_populates="stories")
