from sqlalchemy.orm import Session
from app.models.train_route import TrainRoute
from app.schemas.train_route import TrainRouteCreate, TrainRouteUpdate
from typing import List, Optional

def create_train_route(db: Session, train_route: TrainRouteCreate) -> TrainRoute:
    db_train_route = TrainRoute(**train_route.dict())
    db.add(db_train_route)
    db.commit()
    db.refresh(db_train_route)
    return db_train_route

def get_train_route(db: Session, train_route_id: int) -> Optional[TrainRoute]:
    return db.query(TrainRoute).filter(TrainRoute.id == train_route_id).first()

def get_train_route_by_number(db: Session, train_number: str) -> Optional[TrainRoute]:
    return db.query(TrainRoute).filter(TrainRoute.train_number == train_number).first()

def get_train_routes(db: Session, skip: int = 0, limit: int = 100) -> List[TrainRoute]:
    return db.query(TrainRoute).order_by(TrainRoute.created_at.desc()).offset(skip).limit(limit).all()

def update_train_route(db: Session, train_route_id: int, train_route: TrainRouteUpdate) -> Optional[TrainRoute]:
    db_train_route = db.query(TrainRoute).filter(TrainRoute.id == train_route_id).first()
    if db_train_route:
        update_data = train_route.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_train_route, field, value)
        db.commit()
        db.refresh(db_train_route)
    return db_train_route

def delete_train_route(db: Session, train_route_id: int) -> bool:
    db_train_route = db.query(TrainRoute).filter(TrainRoute.id == train_route_id).first()
    if db_train_route:
        db.delete(db_train_route)
        db.commit()
        return True
    return False

def search_train_routes(db: Session, query: str) -> List[TrainRoute]:
    return db.query(TrainRoute).filter(
        (TrainRoute.train_number.contains(query)) |
        (TrainRoute.train_name_en.contains(query)) |
        (TrainRoute.start_station_en.contains(query)) |
        (TrainRoute.end_station_en.contains(query)) |
        (TrainRoute.start_station_code.contains(query)) |
        (TrainRoute.end_station_code.contains(query))
    ).all() 