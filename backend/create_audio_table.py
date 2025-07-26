#!/usr/bin/env python3
"""
Script to create the audio_files table in the database
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import engine, Base
from app.models.audio_file import AudioFile

def create_audio_table():
    """Create the audio_files table"""
    try:
        print("Creating audio_files table...")
        Base.metadata.create_all(bind=engine, tables=[AudioFile.__table__])
        print("✅ audio_files table created successfully!")
        
        # Verify the table was created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'audio_files' in tables:
            print("✅ Table verification successful!")
            print(f"Available tables: {tables}")
        else:
            print("❌ Table verification failed!")
            
    except Exception as e:
        print(f"❌ Error creating audio_files table: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    create_audio_table() 