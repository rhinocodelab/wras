from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.models.user import User
from app.models.train_route import TrainRoute
from app.models.train_route_translation import TrainRouteTranslation
from app.models.audio_file import AudioFile
from app.services.user_service import create_default_user

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Create default user
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        create_default_user(db)
        print("Default user created successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 