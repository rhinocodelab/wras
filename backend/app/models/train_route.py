from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class TrainRoute(Base):
    __tablename__ = "train_routes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    train_number = Column(String, nullable=False, index=True)
    train_name_en = Column(String, nullable=False)
    start_station_en = Column(String, nullable=False)
    start_station_code = Column(String, nullable=False, index=True)
    end_station_en = Column(String, nullable=False)
    end_station_code = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to translations
    translations = relationship("TrainRouteTranslation", back_populates="train_route", cascade="all, delete-orphan")
    
    # Relationship to audio files
    audio_files = relationship("AudioFile", back_populates="train_route", cascade="all, delete-orphan") 