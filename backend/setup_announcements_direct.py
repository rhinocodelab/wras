#!/usr/bin/env python3
"""
Direct SQL script to create announcement tables and initialize default data
"""

import sqlite3
import os

def setup_announcements():
    """Setup announcement tables and data using direct SQL"""
    print("🚀 Setting up Announcement Templates Database...")
    print("=" * 50)
    
    # Connect to database
    db_path = "wras_dhh.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create announcement_categories table
        print("Creating announcement_categories table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS announcement_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_code TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create announcement_templates table
        print("Creating announcement_templates table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS announcement_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                language_code TEXT NOT NULL,
                template_text TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES announcement_categories (id)
            )
        ''')
        
        # Create announcement_audio_files table
        print("Creating announcement_audio_files table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS announcement_audio_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                template_id INTEGER NOT NULL,
                language_code TEXT NOT NULL,
                audio_file_path TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (template_id) REFERENCES announcement_templates (id)
            )
        ''')
        
        # Create generated_announcements table
        print("Creating generated_announcements table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS generated_announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                language_code TEXT NOT NULL,
                parameters_json TEXT NOT NULL,
                generated_text TEXT NOT NULL,
                audio_file_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES announcement_categories (id)
            )
        ''')
        
        print("✅ Announcement tables created successfully!")
        
        # Insert default categories and templates
        print("Initializing default categories and templates...")
        
        # Default templates
        default_templates = {
            'arriving': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is arriving at platform number {platform}",
            'delay': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is delayed by {delay_time} minutes. We apologize for the inconvenience.",
            'cancelled': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} scheduled for today has been cancelled. We apologize for the inconvenience",
            'platform_change': "Attention Please! The platform for train number {train_number} {train_name} from {start_station} to {end_station} has been changed to platform number {platform}."
        }
        
        categories_data = [
            ('arriving', 'Train arrival announcements'),
            ('delay', 'Train delay announcements'),
            ('cancelled', 'Train cancellation announcements'),
            ('platform_change', 'Platform change announcements')
        ]
        
        categories_created = 0
        templates_created = 0
        
        for category_code, description in categories_data:
            # Check if category exists
            cursor.execute("SELECT id FROM announcement_categories WHERE category_code = ?", (category_code,))
            existing_category = cursor.fetchone()
            
            if not existing_category:
                cursor.execute(
                    "INSERT INTO announcement_categories (category_code, description) VALUES (?, ?)",
                    (category_code, description)
                )
                category_id = cursor.lastrowid
                categories_created += 1
            else:
                category_id = existing_category[0]
            
            # Check if English template exists
            cursor.execute(
                "SELECT id FROM announcement_templates WHERE category_id = ? AND language_code = ?",
                (category_id, 'en')
            )
            existing_template = cursor.fetchone()
            
            if not existing_template:
                cursor.execute(
                    "INSERT INTO announcement_templates (category_id, language_code, template_text) VALUES (?, ?, ?)",
                    (category_id, 'en', default_templates[category_code])
                )
                templates_created += 1
        
        conn.commit()
        print(f"✅ Initialized {categories_created} categories and {templates_created} templates")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {str(e)}")
    finally:
        conn.close()
    
    print("=" * 50)
    print("✅ Announcement Templates setup completed!")

if __name__ == "__main__":
    setup_announcements() 