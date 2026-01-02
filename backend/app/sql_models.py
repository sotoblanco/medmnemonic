from sqlalchemy import Column, String, Text, Integer, JSON, ForeignKey, BigInteger, Table, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, Optional, Any
from .database import Base
import uuid

# Association table for Many-to-Many relationship between Playlists and Stories
playlist_stories = Table(
    "playlist_stories",
    Base.metadata,
    Column("playlist_id", String, ForeignKey("playlists.id", ondelete="CASCADE"), primary_key=True),
    Column("story_id", String, ForeignKey("saved_stories.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    stories: Mapped[List["SavedStory"]] = relationship("SavedStory", back_populates="user", cascade="all, delete-orphan")
    playlists: Mapped[List["Playlist"]] = relationship("Playlist", back_populates="user", cascade="all, delete-orphan")
    progress: Mapped[List["UserProgress"]] = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    concepts: Mapped[List["Concept"]] = relationship("Concept", back_populates="topic", cascade="all, delete-orphan")

class Concept(Base):
    __tablename__ = "concepts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id: Mapped[str] = mapped_column(String, ForeignKey("topics.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    facts: Mapped[List[str]] = mapped_column(JSON) # Canonical facts for this concept
    order: Mapped[int] = mapped_column(Integer, default=0)

    topic: Mapped["Topic"] = relationship("Topic", back_populates="concepts")
    stories: Mapped[List["SavedStory"]] = relationship("SavedStory", back_populates="concept")
    progress: Mapped[List["UserProgress"]] = relationship("UserProgress", back_populates="concept", cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    concept_id: Mapped[str] = mapped_column(String, ForeignKey("concepts.id", ondelete="CASCADE"))
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    last_accessed: Mapped[int] = mapped_column(BigInteger)

    user: Mapped["User"] = relationship("User", back_populates="progress")
    concept: Mapped["Concept"] = relationship("Concept", back_populates="progress")

class SavedStory(Base):
    __tablename__ = "saved_stories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    concept_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("concepts.id"), nullable=True)
    
    topic: Mapped[str] = mapped_column(String) # This serves as the title/main topic name for individual stories
    facts: Mapped[List[str]] = mapped_column(JSON) # Storing List[str]
    story: Mapped[str] = mapped_column(Text)
    associations: Mapped[List[Any]] = mapped_column(JSON) # Storing List[MnemonicAssociation] objects
    visualPrompt: Mapped[str] = mapped_column(Text)
    imageData: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[int] = mapped_column(BigInteger) # Using BigInt for timestamp (ms)

    user: Mapped["User"] = relationship("User", back_populates="stories")
    concept: Mapped[Optional["Concept"]] = relationship("Concept", back_populates="stories")
    playlists: Mapped[List["Playlist"]] = relationship(
        "Playlist",
        secondary=playlist_stories,
        back_populates="stories"
    )

class Playlist(Base):
    __tablename__ = "playlists"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[int] = mapped_column(BigInteger)

    user: Mapped["User"] = relationship("User", back_populates="playlists")
    stories: Mapped[List["SavedStory"]] = relationship(
        "SavedStory",
        secondary=playlist_stories,
        back_populates="playlists"
    )
