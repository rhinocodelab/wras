#!/usr/bin/env python3
"""
Script to create the train_route_translations table in the existing database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.train_route_translation import TrainRouteTranslation

def create_translation_table():
    """Create the train_route_translations table"""
    try:
        # Create the translation table
        TrainRouteTranslation.__table__.create(bind=engine, checkfirst=True)
        print("✅ Train route translations table created successfully!")
        
        # Verify the table was created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if "train_route_translations" in tables:
            print("✅ Table verification successful!")
            
            # Show table structure
            columns = inspector.get_columns("train_route_translations")
            print("\n📋 Table structure:")
            for column in columns:
                print(f"  - {column['name']}: {column['type']}")
        else:
            print("❌ Table creation verification failed!")
            
    except Exception as e:
        print(f"❌ Error creating translation table: {e}")

if __name__ == "__main__":
    print("=== Creating Train Route Translations Table ===\n")
    create_translation_table()
    print("\n=== Complete ===") 