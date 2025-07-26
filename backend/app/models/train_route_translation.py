from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class TrainRouteTranslation(Base):
    __tablename__ = "train_route_translations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    train_route_id = Column(Integer, ForeignKey("train_routes.id"), nullable=False)
    language_code = Column(String, nullable=False)
    train_number = Column(String, nullable=False)  # Original 5-digit number
    train_number_words = Column(String, nullable=False)  # Word representation
    train_name = Column(String, nullable=False)
    start_station_name = Column(String, nullable=False)
    end_station_name = Column(String, nullable=False)
    
    # Relationship
    train_route = relationship("TrainRoute", back_populates="translations") 