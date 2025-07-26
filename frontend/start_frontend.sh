#!/bin/bash

# WRAS-DHH Frontend Startup Script
# This script starts the React frontend application

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
    print_status "Shutting down frontend server..."
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Frontend server stopped"
    fi
    print_success "Frontend shutdown complete"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM EXIT

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the frontend directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_warning "Node.js version $(node --version) detected. Version 16 or higher is recommended."
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "Dependencies not found. Installing npm packages..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies found"
fi

# Check if backend is running (optional check)
print_status "Checking backend connectivity..."
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    print_success "Backend server is running at http://localhost:5001"
else
    print_warning "Backend server is not running at http://localhost:5001"
    print_status "Make sure to start the backend first with: cd ../backend && ./start_backend.sh"
fi

# Start the frontend development server
print_status "Starting WRAS-DHH Frontend server..."
print_status "Frontend will be available at: http://localhost:5173"
print_status "Press Ctrl+C to stop the server"

# Start the development server in background and capture PID
npm run dev &
FRONTEND_PID=$!

# Wait for the server to start
sleep 3

# Check if server started successfully
if kill -0 $FRONTEND_PID 2>/dev/null; then
    print_success "Frontend server started successfully (PID: $FRONTEND_PID)"
    print_status "Opening browser..."
    
    # Try to open browser (works on most Linux systems)
    if command -v xdg-open &> /dev/null; then
        sleep 2
        xdg-open http://localhost:5173 2>/dev/null || true
    elif command -v gnome-open &> /dev/null; then
        sleep 2
        gnome-open http://localhost:5173 2>/dev/null || true
    else
        print_status "Please open your browser and navigate to: http://localhost:5173"
    fi
    
    print_status "Logs will appear below:"
    echo "----------------------------------------"
    
    # Wait for the server process
    wait $FRONTEND_PID
else
    print_error "Failed to start frontend server"
    exit 1
fi 