from app.core.database import engine
from app.models.user import User
from app.models.train_route import TrainRoute
from app.models.train_route_translation import TrainRouteTranslation
from app.models.audio_file import AudioFile
from app.models.announcement_category import AnnouncementCategory
from app.models.announcement_template import AnnouncementTemplate
from app.models.announcement_audio_file import AnnouncementAudioFile
from app.models.announcement_audio_segment import AnnouncementAudioSegment
from app.models.generated_announcement import GeneratedAnnouncement
from app.core.database import Base
from app.services.user_service import create_default_user

def init_db():
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