#!/bin/bash

# WRAS-DHH Full Stack Startup Script
# This script starts both backend and frontend servers

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
    print_status "Shutting down all services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        print_status "Stopping backend server..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        print_status "Stopping frontend server..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM EXIT

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

print_status "Project root: $PROJECT_ROOT"

# Check if backend and frontend directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found at $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

# Start backend server
print_status "Starting backend server..."
cd "$BACKEND_DIR"

# Check if backend startup script exists
if [ ! -f "start_backend.sh" ]; then
    print_error "Backend startup script not found"
    exit 1
fi

# Start backend in background
./start_backend.sh &
BACKEND_PID=$!

# Wait for backend to start
print_status "Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    print_success "Backend server is running at http://localhost:5001"
else
    print_warning "Backend server may not be fully started yet"
fi

# Start frontend server
print_status "Starting frontend server..."
cd "$FRONTEND_DIR"

# Check if frontend startup script exists
if [ ! -f "start_frontend.sh" ]; then
    print_error "Frontend startup script not found"
    exit 1
fi

# Start frontend in background
./start_frontend.sh &
FRONTEND_PID=$!

# Wait for frontend to start
print_status "Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    print_success "Frontend server is running at http://localhost:5173"
else
    print_warning "Frontend server may not be fully started yet"
fi

print_success "Full stack application started!"
print_status "Backend API: http://localhost:5001"
print_status "Backend Docs: http://localhost:5001/docs"
print_status "Frontend App: http://localhost:5173"
print_status ""
print_status "Press Ctrl+C to stop all services"

# Wait for user to stop the services
wait 