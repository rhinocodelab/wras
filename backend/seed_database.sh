#!/bin/bash

# Database Seeding Script for WRAS-DDH
# This script populates the database with announcement categories and templates

echo "🌱 WRAS-DDH Database Seeding Script"
echo "=================================="

# Check if virtual environment exists
if [ ! -d "env" ]; then
    echo "Error: Virtual environment 'env' not found!"
    echo "Please create the virtual environment first."
    exit 1
fi

# Activate virtual environment
echo "Activating virtual environment..."
source env/bin/activate

# Check if required packages are installed
echo "Checking dependencies..."
python -c "import fastapi, uvicorn, sqlalchemy, pydantic" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing required packages..."
    pip install -r requirements.txt
fi

# Check if GCP credentials exist
if [ ! -f "config/isl.json" ]; then
    echo "Warning: GCP credentials file 'config/isl.json' not found!"
    echo "Translation features may not work properly."
    echo "Please ensure the credentials file is in the correct location for full functionality."
fi

# Set environment variables
if [ -f "config/isl.json" ]; then
    export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/config/isl.json"
    echo "GCP credentials configured."
else
    echo "GCP credentials not found - continuing without translation features."
fi

# Run the seeding script
echo "Starting database seeding..."
python3.13 seed_templates.py

echo ""
echo "✅ Database seeding completed!"
echo "You can now start the backend server with: ./start_backend.sh"

