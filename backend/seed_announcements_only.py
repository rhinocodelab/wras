#!/usr/bin/env python3
"""
Database seeder for announcement templates only - avoids TrainRoute import issues
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.announcement_category import AnnouncementCategory
from app.models.announcement_template import AnnouncementTemplate
from app.utils.gcp_client import gcp_client

def create_announcement_tables():
    """Create only announcement tables"""
    print("Creating announcement tables...")
    
    # Create only the announcement tables
    AnnouncementCategory.__table__.create(engine, checkfirst=True)
    AnnouncementTemplate.__table__.create(engine, checkfirst=True)
    
    print("✅ Announcement tables created successfully!")

def get_translate_client():
    """Initialize Google Translate client"""
    try:
        return gcp_client
    except Exception as e:
        print(f"Error initializing GCP client: {e}")
        return None

def translate_text(client, text, target_language):
    """Translate text to target language"""
    try:
        if client:
            result = client.translate_text(text, 'en', target_language)
            return result
        else:
            print(f"Warning: No translation client available for {target_language}")
            return text
    except Exception as e:
        print(f"Translation error for {target_language}: {e}")
        return text

def seed_announcements():
    """Seed the database with announcement categories and multilingual templates"""
    print("🌱 Starting announcement categories seeding...")
    
    # Create tables if they don't exist
    create_announcement_tables()
    
    # Initialize translation client
    translate_client = get_translate_client()
    
    # Define categories and their descriptions
    categories_data = [
        {
            "category_code": "arriving",
            "description": "Train arrival announcements"
        },
        {
            "category_code": "delay", 
            "description": "Train delay announcements"
        },
        {
            "category_code": "cancelled",
            "description": "Train cancellation announcements"
        },
        {
            "category_code": "platform_change",
            "description": "Platform change announcements"
        }
    ]
    
    # Define English templates for each category
    english_templates = {
        'arriving': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is arriving at platform number {platform}",
        'delay': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is running late. We apologize for the inconvenience.",
        'cancelled': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} scheduled for today has been cancelled. We apologize for the inconvenience",
        'platform_change': "Attention Please! The platform for train number {train_number} {train_name} from {start_station} to {end_station} has been changed to platform number {platform}."
    }
    
    # Supported languages
    languages = ['en', 'hi', 'mr', 'gu']
    language_names = {
        'en': 'English',
        'hi': 'Hindi',
        'mr': 'Marathi', 
        'gu': 'Gujarati'
    }
    
    db = SessionLocal()
    
    try:
        # Clear existing data
        existing_categories = db.query(AnnouncementCategory).count()
        existing_templates = db.query(AnnouncementTemplate).count()
        
        if existing_categories > 0 or existing_templates > 0:
            print(f"🗑️  Clearing existing data...")
            print(f"   Categories: {existing_categories}")
            print(f"   Templates: {existing_templates}")
            
            db.query(AnnouncementTemplate).delete()
            db.query(AnnouncementCategory).delete()
            db.commit()
            print(f"✅ Cleared existing data")
        
        print("📝 Creating announcement categories and templates...")
        
        categories_created = 0
        templates_created = 0
        
        for category_data in categories_data:
            category_code = category_data['category_code']
            description = category_data['description']
            
            print(f"\n🔄 Processing category: {category_code}")
            
            # Create category
            category = AnnouncementCategory(
                category_code=category_code,
                description=description
            )
            db.add(category)
            db.flush()  # Get the ID
            categories_created += 1
            print(f"   ✅ Created category: {category_code}")
            
            # Get English template text
            english_text = english_templates[category_code]
            
            # Create templates for all languages
            for lang_code in languages:
                if lang_code == 'en':
                    # Use English template as-is
                    template_text = english_text
                else:
                    # Translate English template to target language
                    print(f"   🔄 Translating to {language_names[lang_code]}...")
                    template_text = translate_text(translate_client, english_text, lang_code)
                
                # Create template
                template = AnnouncementTemplate(
                    category_id=category.id,
                    language_code=lang_code,
                    template_text=template_text
                )
                db.add(template)
                templates_created += 1
                
                print(f"   ✅ Created {language_names[lang_code]} template")
                print(f"      Text: {template_text[:60]}...")
            
            print(f"   ✅ Completed category: {category_code}")
        
        # Commit all changes
        db.commit()
        print(f"\n🎉 Successfully created {categories_created} categories and {templates_created} templates!")
        
        # Display summary
        print("\n📊 Database Summary:")
        for category in db.query(AnnouncementCategory).all():
            template_count = db.query(AnnouncementTemplate).filter(
                AnnouncementTemplate.category_id == category.id
            ).count()
            print(f"   {category.category_code.capitalize()}: {template_count} templates")
        
        # Show sample templates
        print("\n📋 Sample Templates:")
        for category in db.query(AnnouncementCategory).all():
            print(f"\n   {category.category_code.upper()}:")
            templates = db.query(AnnouncementTemplate).filter(
                AnnouncementTemplate.category_id == category.id
            ).all()
            
            for template in templates:
                lang_name = language_names.get(template.language_code, template.language_code)
                print(f"     {lang_name}: {template.template_text[:80]}...")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_announcements() 