#!/usr/bin/env python3
"""
Simple script to create announcement tables and initialize default data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal, Base
from app.models.announcement_category import AnnouncementCategory
from app.models.announcement_template import AnnouncementTemplate
from app.models.announcement_audio_file import AnnouncementAudioFile
from app.models.generated_announcement import GeneratedAnnouncement

def create_announcement_tables():
    """Create only announcement tables"""
    print("Creating announcement tables...")
    
    # Create only the announcement tables
    AnnouncementCategory.__table__.create(engine, checkfirst=True)
    AnnouncementTemplate.__table__.create(engine, checkfirst=True)
    AnnouncementAudioFile.__table__.create(engine, checkfirst=True)
    GeneratedAnnouncement.__table__.create(engine, checkfirst=True)
    
    print("✅ Announcement tables created successfully!")

def initialize_default_data():
    """Initialize default categories and templates"""
    print("Initializing default categories and templates...")
    
    db = SessionLocal()
    try:
        # Default English templates
        default_templates = {
            'arriving': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is arriving at platform number {platform}",
            'delay': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is delayed by {delay_time} minutes. We apologize for the inconvenience.",
            'cancelled': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} scheduled for today has been cancelled. We apologize for the inconvenience",
            'platform_change': "Attention Please! The platform for train number {train_number} {train_name} from {start_station} to {end_station} has been changed to platform number {platform}."
        }
        
        categories_created = 0
        templates_created = 0
        
        for category_code, description in [
            ('arriving', 'Train arrival announcements'),
            ('delay', 'Train delay announcements'),
            ('cancelled', 'Train cancellation announcements'),
            ('platform_change', 'Platform change announcements')
        ]:
            # Check if category exists
            existing_category = db.query(AnnouncementCategory).filter(
                AnnouncementCategory.category_code == category_code
            ).first()
            
            if not existing_category:
                category = AnnouncementCategory(
                    category_code=category_code,
                    description=description
                )
                db.add(category)
                db.flush()  # Get the ID
                categories_created += 1
            else:
                category = existing_category
            
            # Check if English template exists
            existing_template = db.query(AnnouncementTemplate).filter(
                AnnouncementTemplate.category_id == category.id,
                AnnouncementTemplate.language_code == 'en'
            ).first()
            
            if not existing_template:
                template = AnnouncementTemplate(
                    category_id=category.id,
                    language_code='en',
                    template_text=default_templates[category_code]
                )
                db.add(template)
                templates_created += 1
        
        db.commit()
        
        print(f"✅ Initialized {categories_created} categories and {templates_created} templates")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error initializing data: {str(e)}")
    finally:
        db.close()

def main():
    print("🚀 Setting up Announcement Templates Database...")
    print("=" * 50)
    
    # Create tables
    create_announcement_tables()
    
    # Initialize default data
    initialize_default_data()
    
    print("=" * 50)
    print("✅ Announcement Templates setup completed!")

if __name__ == "__main__":
    main() 