#!/usr/bin/env python3
"""
Script to create announcement tables and initialize default data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal
from app.models.announcement_category import AnnouncementCategory
from app.models.announcement_template import AnnouncementTemplate
from app.models.announcement_audio_file import AnnouncementAudioFile
from app.models.generated_announcement import GeneratedAnnouncement
from app.core.database import Base
from app.services.announcement_service import announcement_service

def create_tables():
    """Create all announcement tables"""
    print("Creating announcement tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Announcement tables created successfully!")

def initialize_default_data():
    """Initialize default categories and templates"""
    print("Initializing default categories and templates...")
    
    db = SessionLocal()
    try:
        result = announcement_service.initialize_categories_and_templates(db)
        
        if result["success"]:
            print(f"✅ {result['message']}")
            print(f"   Categories created: {result['categories_created']}")
            print(f"   Templates created: {result['templates_created']}")
        else:
            print(f"❌ Error: {result['error']}")
            
    except Exception as e:
        print(f"❌ Error initializing data: {str(e)}")
    finally:
        db.close()

def main():
    print("🚀 Setting up Announcement Templates Database...")
    print("=" * 50)
    
    # Create tables
    create_tables()
    
    # Initialize default data
    initialize_default_data()
    
    print("=" * 50)
    print("✅ Announcement Templates setup completed!")

if __name__ == "__main__":
    main() 