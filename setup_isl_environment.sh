#!/bin/bash

# ISL Dataset Environment Setup Script
# This script sets up the ISL dataset in /var/www/war-ddh/ for web application access

set -e  # Exit on any error

# Configuration
SOURCE_DIR="isl_dataset"
TARGET_DIR="/var/www/war-ddh/isl_dataset"
WEB_USER="www-data"
WEB_GROUP="www-data"

echo "🚀 Starting ISL Dataset Environment Setup..."

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root or with sudo privileges"
   echo "Usage: sudo ./setup_isl_environment.sh"
   exit 1
fi

# Check if source directory exists
if [[ ! -d "$SOURCE_DIR" ]]; then
    echo "❌ Source directory '$SOURCE_DIR' not found!"
    echo "Please ensure the isl_dataset folder exists in the current directory"
    exit 1
fi

echo "📁 Creating target directory structure..."

# Create target directory
mkdir -p "$TARGET_DIR"

# Copy the entire dataset
echo "📋 Copying ISL dataset files..."
cp -r "$SOURCE_DIR"/* "$TARGET_DIR/"

# Set proper ownership
echo "🔐 Setting proper ownership and permissions..."
chown -R $WEB_USER:$WEB_GROUP "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"

# Set specific permissions for MP4 files
echo "🎥 Setting MP4 file permissions..."
find "$TARGET_DIR" -name "*.mp4" -type f -exec chmod 644 {} \;

# Create a symbolic link in the current project directory for development
echo "🔗 Creating symbolic link for development..."
if [[ -L "isl_dataset_link" ]]; then
    rm "isl_dataset_link"
fi
ln -s "$TARGET_DIR" "isl_dataset_link"

# Create a simple index file for web access
echo "📄 Creating web access index..."
cat > "$TARGET_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ISL Dataset - Railway Announcements</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; }
        .dataset-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .video-item { border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
        .video-item h3 { margin: 0 0 10px 0; color: #555; }
        video { width: 100%; border-radius: 3px; }
        .stats { background: #e8f4fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚂 ISL Dataset - Railway Announcements</h1>
        
        <div class="dataset-info">
            <h2>Dataset Information</h2>
            <p>This dataset contains Indian Sign Language (ISL) videos for railway announcement terms.</p>
            <div class="stats">
                <strong>Total Videos:</strong> 18<br>
                <strong>Categories:</strong> Numbers, Train Terms, Status Terms, Station Names<br>
                <strong>Format:</strong> MP4 Video Files<br>
                <strong>Purpose:</strong> Accessibility for hearing-impaired passengers
            </div>
        </div>

        <h2>Available Videos</h2>
        <div class="video-grid">
            <div class="video-item">
                <h3>Numbers</h3>
                <video controls>
                    <source src="1/1.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <p><strong>1</strong> - Number one</p>
            </div>
            <div class="video-item">
                <h3>Numbers</h3>
                <video controls>
                    <source src="2/2.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <p><strong>2</strong> - Number two</p>
            </div>
            <div class="video-item">
                <h3>Numbers</h3>
                <video controls>
                    <source src="3/3.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <p><strong>3</strong> - Number three</p>
            </div>
            <div class="video-item">
                <h3>Train Terms</h3>
                <video controls>
                    <source src="train/train.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <p><strong>Train</strong> - Train announcement</p>
            </div>
            <div class="video-item">
                <h3>Platform</h3>
                <video controls>
                    <source src="platform/platform.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <p><strong>Platform</strong> - Platform information</p>
            </div>
            <div class="video-item">
                <h3>Status</h3>
                <video controls>
                    <source src="arriving/arriving.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <p><strong>Arriving</strong> - Train arriving</p>
            </div>
        </div>

        <div class="dataset-info">
            <h3>API Access</h3>
            <p>Videos can be accessed via HTTP requests to:</p>
            <code>http://your-domain/isl_dataset/[category]/[filename].mp4</code>
            <br><br>
            <p><strong>Example:</strong> <code>http://your-domain/isl_dataset/train/train.mp4</code></p>
        </div>
    </div>
</body>
</html>
EOF

# Set permissions for the index file
chown $WEB_USER:$WEB_GROUP "$TARGET_DIR/index.html"
chmod 644 "$TARGET_DIR/index.html"

# Create a configuration file for the application
echo "⚙️ Creating application configuration..."
cat > "$TARGET_DIR/config.json" << 'EOF'
{
    "dataset_info": {
        "name": "ISL Railway Announcements Dataset",
        "version": "1.0",
        "description": "Indian Sign Language videos for railway announcement terms",
        "total_videos": 18,
        "categories": [
            "numbers",
            "train_terms", 
            "status_terms",
            "station_names"
        ]
    },
    "videos": {
        "numbers": ["1", "2", "3", "one", "two", "three"],
        "train_terms": ["train", "platform", "express", "running"],
        "status_terms": ["arrive", "arriving", "late", "cancelled", "attention"],
        "station_names": ["bandra", "vapi"],
        "other": ["number"]
    },
    "api_endpoints": {
        "base_url": "/isl_dataset",
        "video_format": "mp4",
        "access_pattern": "{base_url}/{category}/{filename}.mp4"
    }
}
EOF

# Set permissions for the config file
chown $WEB_USER:$WEB_GROUP "$TARGET_DIR/config.json"
chmod 644 "$TARGET_DIR/config.json"

# Create a simple health check script
echo "🏥 Creating health check script..."
cat > "$TARGET_DIR/health_check.php" << 'EOF'
<?php
header('Content-Type: application/json');

$dataset_path = __DIR__;
$videos = glob($dataset_path . '/*/*.mp4');
$categories = array_filter(glob($dataset_path . '/*'), 'is_dir');

$health_status = [
    'status' => 'healthy',
    'timestamp' => date('Y-m-d H:i:s'),
    'total_videos' => count($videos),
    'total_categories' => count($categories),
    'dataset_path' => $dataset_path,
    'videos' => []
];

foreach ($videos as $video) {
    $relative_path = str_replace($dataset_path . '/', '', $video);
    $health_status['videos'][] = [
        'path' => $relative_path,
        'size' => filesize($video),
        'accessible' => is_readable($video)
    ];
}

echo json_encode($health_status, JSON_PRETTY_PRINT);
?>
EOF

# Set permissions for the health check script
chown $WEB_USER:$WEB_GROUP "$TARGET_DIR/health_check.php"
chmod 644 "$TARGET_DIR/health_check.php"

# Verify the setup
echo "✅ Verifying setup..."
if [[ -d "$TARGET_DIR" ]]; then
    video_count=$(find "$TARGET_DIR" -name "*.mp4" | wc -l)
    echo "✅ Target directory created successfully"
    echo "✅ $video_count MP4 files copied"
    echo "✅ Permissions set correctly"
    echo "✅ Web access files created"
else
    echo "❌ Setup verification failed"
    exit 1
fi

# Display final information
echo ""
echo "🎉 ISL Dataset Environment Setup Complete!"
echo ""
echo "📋 Setup Summary:"
echo "   • Source: $SOURCE_DIR"
echo "   • Target: $TARGET_DIR"
echo "   • Total Videos: $video_count"
echo "   • Web Access: http://your-domain/isl_dataset/"
echo "   • Health Check: http://your-domain/isl_dataset/health_check.php"
echo ""
echo "🔗 Development Link: isl_dataset_link -> $TARGET_DIR"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure your web server to serve from /var/www/war-ddh/"
echo "   2. Test web access to the videos"
echo "   3. Integrate with your application using the config.json"
echo "   4. Use the health check endpoint to monitor dataset status"
echo ""
echo "🔧 To test the setup, run:"
echo "   curl http://localhost/isl_dataset/health_check.php"
echo "" 