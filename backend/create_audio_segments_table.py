#!/usr/bin/env python3
"""
Script to create the announcement_audio_segments table
"""

import sqlite3
import os

def create_audio_segments_table():
    """Create the announcement_audio_segments table"""
    print("🚀 Creating Announcement Audio Segments Table...")
    print("=" * 50)
    
    # Connect to database
    db_path = "wras_dhh.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create announcement_audio_segments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS announcement_audio_segments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                segment_name TEXT NOT NULL,
                segment_text TEXT NOT NULL,
                language_code TEXT NOT NULL,
                audio_file_path TEXT NOT NULL,
                audio_duration REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES announcement_categories(id)
            )
        """)
        
        # Create indexes for better performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audio_segments_category_lang 
            ON announcement_audio_segments(category_id, language_code)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audio_segments_segment_name 
            ON announcement_audio_segments(segment_name)
        """)
        
        conn.commit()
        
        print("✅ Announcement Audio Segments table created successfully!")
        
        # Verify table creation
        cursor.execute("PRAGMA table_info(announcement_audio_segments)")
        columns = cursor.fetchall()
        
        print("\n📋 Table Structure:")
        for column in columns:
            print(f"   {column[1]} ({column[2]}) - {'NOT NULL' if column[3] else 'NULL'}")
        
        # Check if table has any data
        cursor.execute("SELECT COUNT(*) FROM announcement_audio_segments")
        count = cursor.fetchone()[0]
        print(f"\n📊 Current records: {count}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {str(e)}")
    finally:
        conn.close()
    
    print("\n" + "=" * 50)
    print("✅ Audio Segments Table Setup Completed!")

if __name__ == "__main__":
    create_audio_segments_table() 