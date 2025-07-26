#!/usr/bin/env python3
"""
Test script to verify database connectivity and table access
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.train_route import TrainRoute
from app.models.user import User

def test_database():
    print("Testing database connectivity...")
    
    # Test 1: Check if we can connect to the database
    try:
        db = SessionLocal()
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # Test 2: Check if train_routes table exists and is accessible
    try:
        result = db.query(TrainRoute).first()
        print("✅ train_routes table is accessible")
        print(f"   Current record count: {db.query(TrainRoute).count()}")
    except Exception as e:
        print(f"❌ train_routes table access failed: {e}")
    
    # Test 3: Check if users table exists and is accessible
    try:
        result = db.query(User).first()
        print("✅ users table is accessible")
        print(f"   Current record count: {db.query(User).count()}")
    except Exception as e:
        print(f"❌ users table access failed: {e}")
    
    # Test 4: List all tables
    try:
        tables = engine.table_names()
        print(f"✅ Available tables: {tables}")
    except Exception as e:
        print(f"❌ Could not list tables: {e}")
    
    db.close()

if __name__ == "__main__":
    test_database() 