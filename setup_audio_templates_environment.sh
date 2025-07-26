#!/bin/bash

# Audio Templates Environment Setup Script
# This script sets up the directory structure and environment for audio templates

set -e

# Configuration
SOURCE_DIR="audio_templates"
TARGET_DIR="/var/www/war-ddh/audio-templates"
# Get the original user (not root when using sudo)
CURRENT_USER=${SUDO_USER:-$(whoami)}
CURRENT_GROUP=$(id -gn $CURRENT_USER)
BACKUP_DIR="/var/www/war-ddh/backups/audio-templates"

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

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to create directory structure
create_directory_structure() {
    print_status "Creating directory structure..."
    
    # Create main target directory
    mkdir -p "$TARGET_DIR"
    
    # Create subdirectories for organization
    mkdir -p "$TARGET_DIR/templates"
    mkdir -p "$TARGET_DIR/temp"
    mkdir -p "$TARGET_DIR/logs"
    mkdir -p "$BACKUP_DIR"
    
    print_success "Directory structure created"
}

# Function to set permissions
set_permissions() {
    print_status "Setting permissions..."
    
    # Set ownership
    chown -R "$CURRENT_USER:$CURRENT_GROUP" "$TARGET_DIR"
    chown -R "$CURRENT_USER:$CURRENT_GROUP" "$BACKUP_DIR"
    
    # Set directory permissions
    find "$TARGET_DIR" -type d -exec chmod 755 {} \;
    
    # Set file permissions (for future files)
    find "$TARGET_DIR" -type f -exec chmod 644 {} \;
    
    # Make logs directory writable
    chmod 775 "$TARGET_DIR/logs"
    
    print_success "Permissions set correctly"
}

# Function to create configuration files
create_config_files() {
    print_status "Creating configuration files..."
    
    # Create main config file
    cat > "$TARGET_DIR/config.json" << EOF
{
    "audio_templates_config": {
        "version": "1.0.0",
        "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "directory_structure": {
            "templates": "Individual template directories",
            "temp": "Temporary files during generation",
            "logs": "Generation and access logs",
            "backups": "Backup location"
        },
        "supported_languages": ["en", "hi", "mr", "gu"],
        "audio_format": "mp3",
        "max_text_length": 1000,
        "api_access_path": "/api/v1/audio-templates"
    }
}
EOF

    print_success "Configuration files created"
}

# Function to create symbolic link for development
create_symbolic_link() {
    print_status "Creating symbolic link for development..."
    
    # Remove existing link if it exists
    if [ -L "audio_templates_link" ]; then
        rm "audio_templates_link"
    fi
    
    # Create symbolic link
    ln -s "$TARGET_DIR" "audio_templates_link"
    
    print_success "Symbolic link created: audio_templates_link -> $TARGET_DIR"
}

# Function to display setup summary
display_summary() {
    print_status "Setup Summary:"
    echo "=================================="
    echo "Target Directory: $TARGET_DIR"
    echo "Backup Directory: $BACKUP_DIR"
    echo "Web User: $CURRENT_USER"
    echo "Web Group: $CURRENT_GROUP"
    echo ""
    
    print_status "Directory Structure:"
    echo "├── $TARGET_DIR/"
    echo "│   ├── templates/          (Individual template directories)"
    echo "│   ├── temp/               (Temporary files)"
    echo "│   ├── logs/               (Log files)"
    echo "│   └── config.json         (Configuration)"
    echo "├── $BACKUP_DIR/            (Backup location)"
    echo "└── audio_templates_link    (Development link)"
    echo ""
    
    print_status "Permissions:"
    echo "Owner: $CURRENT_USER:$CURRENT_GROUP"
    echo "Directories: 755"
    echo "Files: 644"
    echo "Logs: 775"
    echo ""
    
    print_status "Access Method:"
    echo "Audio templates will be accessed through the backend API"
    echo "API Endpoint: /api/v1/audio-templates/"
    echo ""
    
    print_success "Audio Templates environment setup completed successfully!"
}

# Function to verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if directories exist
    if [ ! -d "$TARGET_DIR" ]; then
        print_error "Target directory not found: $TARGET_DIR"
        return 1
    fi
    
    if [ ! -d "$TARGET_DIR/templates" ]; then
        print_error "Templates directory not found"
        return 1
    fi
    
    if [ ! -d "$TARGET_DIR/temp" ]; then
        print_error "Temp directory not found"
        return 1
    fi
    
    if [ ! -d "$TARGET_DIR/logs" ]; then
        print_error "Logs directory not found"
        return 1
    fi
    
    # Check permissions
    if [ "$(stat -c %U $TARGET_DIR)" != "$CURRENT_USER" ]; then
        print_warning "Ownership not set correctly for $TARGET_DIR"
    fi
    
    # Check if config file exists
    if [ ! -f "$TARGET_DIR/config.json" ]; then
        print_error "Config file not found"
        return 1
    fi
    
    print_success "Setup verification completed"
}

# Main execution
main() {
    echo "=================================="
    echo "Audio Templates Environment Setup"
    echo "=================================="
    echo ""
    
    # Check if running as root
    check_root
    
    # Create directory structure
    create_directory_structure
    
    # Set permissions
    set_permissions
    
    # Create configuration files
    create_config_files
    
    # Create symbolic link
    create_symbolic_link
    
    # Verify setup
    verify_setup
    
    # Display summary
    display_summary
    
    echo ""
    print_status "Next steps:"
    echo "1. Add audio templates static mount to backend (similar to ai-audio-translations)"
    echo "2. Create API endpoints for audio templates in backend"
    echo "3. Add the Audio Templates menu to your frontend"
    echo "4. Test audio template generation through the API"
    echo ""
}

# Run main function
main "$@" 