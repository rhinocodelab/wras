from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class AnnouncementCategory(Base):
    __tablename__ = "announcement_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_code = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to templates
    templates = relationship("AnnouncementTemplate", back_populates="category", cascade="all, delete-orphan")
    # Relationship to audio segments
    audio_segments = relationship("AnnouncementAudioSegment", back_populates="category", cascade="all, delete-orphan") 