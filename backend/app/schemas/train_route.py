from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TrainRouteBase(BaseModel):
    train_number: str
    train_name_en: str
    start_station_en: str
    start_station_code: str
    end_station_en: str
    end_station_code: str

class TrainRouteCreate(TrainRouteBase):
    pass

class TrainRouteUpdate(BaseModel):
    train_number: Optional[str] = None
    train_name_en: Optional[str] = None
    start_station_en: Optional[str] = None
    start_station_code: Optional[str] = None
    end_station_en: Optional[str] = None
    end_station_code: Optional[str] = None

class TrainRoute(TrainRouteBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 