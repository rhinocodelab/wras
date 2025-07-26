from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    train_route_id = Column(Integer, ForeignKey("train_routes.id"), nullable=False)
    language_code = Column(String, nullable=False)
    audio_type = Column(String, nullable=False)  # 'train_number_words', 'train_name', 'start_station_name', 'end_station_name'
    audio_file_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    train_route = relationship("TrainRoute", back_populates="audio_files") 