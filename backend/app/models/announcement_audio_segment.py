from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AnnouncementAudioSegment(Base):
    __tablename__ = "announcement_audio_segments"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("announcement_categories.id"), nullable=False)
    segment_name = Column(String(50), nullable=False)  # e.g., "prefix", "from", "to", "suffix"
    segment_text = Column(Text, nullable=False)  # actual text content
    language_code = Column(String(10), nullable=False)  # 'en', 'hi', 'mr', 'gu'
    audio_file_path = Column(String(500), nullable=False)  # path to audio file
    audio_duration = Column(Float)  # duration in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("AnnouncementCategory", back_populates="audio_segments")

    class Config:
        from_attributes = True 