#!/bin/bash

# WRAS-DHH Backend Startup Script
# This script starts the FastAPI backend server in a virtual environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down backend server..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        print_status "Backend server stopped"
    fi
    print_status "Deactivating virtual environment..."
    deactivate 2>/dev/null || true
    print_success "Backend shutdown complete"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM EXIT

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ]; then
    print_error "This script must be run from the backend directory"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "env" ]; then
    print_error "Virtual environment 'env' not found. Please create it first."
    print_status "You can create it with: python3.13 -m venv env"
    exit 1
fi

# Check if requirements are installed
if [ ! -f "env/lib/python*/site-packages/fastapi" ]; then
    print_warning "Dependencies not found. Installing requirements..."
    source env/bin/activate
    python3.13 -m pip install -r requirements.txt
    print_success "Dependencies installed"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source env/bin/activate

# Check if database exists, if not initialize it
if [ ! -f "wras_dhh.db" ]; then
    print_warning "Database not found. Initializing database..."
    python3.13 init_database.py
    print_success "Database initialized"
fi

# Start the backend server
print_status "Starting WRAS-DHH Backend server..."
print_status "Server will be available at: http://localhost:5001"
print_status "API Documentation: http://localhost:5001/docs"
print_status "Press Ctrl+C to stop the server"

# Start the server in background and capture PID
python3.13 -m uvicorn app.main:app --reload --port 5001 --host 0.0.0.0 &
SERVER_PID=$!

# Wait for the server to start
sleep 2

# Check if server started successfully
if kill -0 $SERVER_PID 2>/dev/null; then
    print_success "Backend server started successfully (PID: $SERVER_PID)"
    print_status "Logs will appear below:"
    echo "----------------------------------------"
    
    # Wait for the server process
    wait $SERVER_PID
else
    print_error "Failed to start backend server"
    exit 1
fi 