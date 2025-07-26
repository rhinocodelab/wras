from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class AnnouncementTemplate(Base):
    __tablename__ = "announcement_templates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("announcement_categories.id"), nullable=False)
    language_code = Column(String, nullable=False)
    template_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to category
    category = relationship("AnnouncementCategory", back_populates="templates")
    
    # Relationship to audio files
    audio_files = relationship("AnnouncementAudioFile", back_populates="template", cascade="all, delete-orphan") 