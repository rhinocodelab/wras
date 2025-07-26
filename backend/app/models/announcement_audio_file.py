from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class AnnouncementAudioFile(Base):
    __tablename__ = "announcement_audio_files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("announcement_templates.id"), nullable=False)
    language_code = Column(String, nullable=False)
    audio_file_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to template
    template = relationship("AnnouncementTemplate", back_populates="audio_files") 