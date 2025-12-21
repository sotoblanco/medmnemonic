from sqlalchemy import Column, String, Text, Integer, JSON, ForeignKey, BigInteger, Table
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
    
    # Relationships
    stories: Mapped[List["SavedStory"]] = relationship("SavedStory", back_populates="user", cascade="all, delete-orphan")
    playlists: Mapped[List["Playlist"]] = relationship("Playlist", back_populates="user", cascade="all, delete-orphan")

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
