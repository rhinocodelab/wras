#!/bin/bash

# Setup Audio Environment Script for WRAS DHH v2 (User Directory Version)
# This script creates the necessary directory structure in a user-writable location

echo "🚀 Setting up Audio Environment for WRAS DHH v2 (User Directory Version)..."

# Get current user
CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn)

echo "👤 Current user: $CURRENT_USER"
echo "👥 Current group: $CURRENT_GROUP"

# Define the base audio directory in user's home directory
AUDIO_BASE_DIR="$HOME/war-ddh/ai-audio-translations"

echo "📁 Creating audio storage directory structure in user directory..."

# Create the main audio directory
mkdir -p "$AUDIO_BASE_DIR"

# Set proper ownership to current user
echo "🔐 Setting proper ownership and permissions..."
chown -R "$CURRENT_USER:$CURRENT_GROUP" "$AUDIO_BASE_DIR"
chmod -R 755 "$AUDIO_BASE_DIR"

# Create a .gitkeep file to ensure the directory is tracked in git
touch "$AUDIO_BASE_DIR/.gitkeep"

# Create a sample directory structure for demonstration
echo "📂 Creating sample directory structure..."
mkdir -p "$AUDIO_BASE_DIR/sample_train_12345/en"
mkdir -p "$AUDIO_BASE_DIR/sample_train_12345/hi"
mkdir -p "$AUDIO_BASE_DIR/sample_train_12345/mr"
mkdir -p "$AUDIO_BASE_DIR/sample_train_12345/gu"

# Create sample README file
cat > "$AUDIO_BASE_DIR/README.md" << 'EOF'
# AI Audio Translations Directory

This directory contains AI-generated audio files for train route translations.

## Directory Structure
```
~/war-ddh/ai-audio-translations/
├── train_12345/
│   ├── en/
│   │   ├── train_number_words.mp3
│   │   ├── train_name.mp3
│   │   ├── start_station_name.mp3
│   │   └── end_station_name.mp3
│   ├── hi/
│   ├── mr/
│   └── gu/
```

## File Naming Convention
- `train_number_words.mp3` - Audio for train number in words
- `train_name.mp3` - Audio for train name
- `start_station_name.mp3` - Audio for start station name
- `end_station_name.mp3` - Audio for end station name

## Languages Supported
- en: English (India) - en-IN-Chirp3-HD-Achernar
- hi: Hindi (India) - hi-IN-Chirp3-HD-Achernar
- mr: Marathi (India) - mr-IN-Chirp3-HD-Achernar
- gu: Gujarati (India) - gu-IN-Chirp3-HD-Achernar

## Permissions
- Owner: Current application user
- Group: Current user's group
- Permissions: 755 (rwxr-xr-x)

## Note
This directory is in the user's home directory for easy access and permissions.
EOF

# Set permissions for the README
chown "$CURRENT_USER:$CURRENT_GROUP" "$AUDIO_BASE_DIR/README.md"
chmod 644 "$AUDIO_BASE_DIR/README.md"

# Create a configuration file for the application
cat > "$AUDIO_BASE_DIR/config.json" << 'EOF'
{
  "audio_base_path": "~/war-ddh/ai-audio-translations",
  "supported_languages": {
    "en": {
      "code": "en-IN",
      "voice": "en-IN-Chirp3-HD-Achernar",
      "name": "English (India)"
    },
    "hi": {
      "code": "hi-IN",
      "voice": "hi-IN-Chirp3-HD-Achernar",
      "name": "Hindi (India)"
    },
    "mr": {
      "code": "mr-IN",
      "voice": "mr-IN-Chirp3-HD-Achernar",
      "name": "Marathi (India)"
    },
    "gu": {
      "code": "gu-IN",
      "voice": "gu-IN-Chirp3-HD-Achernar",
      "name": "Gujarati (India)"
    }
  },
  "audio_types": [
    "train_number_words",
    "train_name",
    "start_station_name",
    "end_station_name"
  ],
  "file_format": "mp3",
  "sample_rate": 24000
}
EOF

# Set permissions for the config file
chown "$CURRENT_USER:$CURRENT_GROUP" "$AUDIO_BASE_DIR/config.json"
chmod 644 "$AUDIO_BASE_DIR/config.json"

# Verify the setup
echo "✅ Verifying setup..."
if [ -d "$AUDIO_BASE_DIR" ]; then
    echo "✅ Audio directory created successfully: $AUDIO_BASE_DIR"
else
    echo "❌ Failed to create audio directory"
    exit 1
fi

# Check permissions
PERMISSIONS=$(ls -ld "$AUDIO_BASE_DIR" | awk '{print $1}')
OWNER=$(ls -ld "$AUDIO_BASE_DIR" | awk '{print $3}')
GROUP=$(ls -ld "$AUDIO_BASE_DIR" | awk '{print $4}')

echo "✅ Directory permissions: $PERMISSIONS"
echo "✅ Directory owner: $OWNER:$GROUP"

# Display directory structure
echo ""
echo "📂 Directory structure created:"
tree "$AUDIO_BASE_DIR" 2>/dev/null || find "$AUDIO_BASE_DIR" -type d | sed -e "s/[^-][^\/]*\//  |/g" -e "s/|\([^ ]\)/|-\1/"

echo ""
echo "🎉 Audio environment setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Update your backend configuration to use: $AUDIO_BASE_DIR"
echo "   2. Ensure your web server can serve files from this directory"
echo "   3. Test audio file access via: http://your-domain/ai-audio-translations/"
echo "   4. Run the backend application to generate audio files"
echo ""
echo "🔧 Configuration files created:"
echo "   - $AUDIO_BASE_DIR/config.json (voice configurations)"
echo "   - $AUDIO_BASE_DIR/README.md (documentation)"
echo ""
echo "💡 Alternative: If you prefer to use /var/www/war-ddh, run:"
echo "   sudo ./setup_audio_environment.sh" 