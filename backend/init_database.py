#!/usr/bin/env python3
"""
Database initialization script for WRAS-DHH Backend
"""

from app.core.init_db import init_db

if __name__ == "__main__":
    print("Initializing WRAS-DHH database...")
    init_db()
    print("Database initialization completed!") 