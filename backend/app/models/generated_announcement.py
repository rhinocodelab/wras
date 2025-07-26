from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class GeneratedAnnouncement(Base):
    __tablename__ = "generated_announcements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("announcement_categories.id"), nullable=False)
    language_code = Column(String, nullable=False)
    parameters_json = Column(JSON, nullable=False)
    generated_text = Column(Text, nullable=False)
    audio_file_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to category
    category = relationship("AnnouncementCategory") 