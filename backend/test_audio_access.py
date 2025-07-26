#!/usr/bin/env python3
"""
Script to test audio file access and directory permissions
"""

import os
import sys

def test_audio_directory():
    """Test if the audio directory exists and is accessible"""
    audio_dir = "/var/www/war-ddh/ai-audio-translations"
    
    print("🔍 Testing audio directory access...")
    print(f"Directory: {audio_dir}")
    
    # Check if directory exists
    if not os.path.exists(audio_dir):
        print("❌ Directory does not exist!")
        return False
    
    print("✅ Directory exists")
    
    # Check if it's a directory
    if not os.path.isdir(audio_dir):
        print("❌ Path is not a directory!")
        return False
    
    print("✅ Path is a directory")
    
    # Check read permissions
    if not os.access(audio_dir, os.R_OK):
        print("❌ No read permission!")
        return False
    
    print("✅ Read permission granted")
    
    # List contents
    try:
        contents = os.listdir(audio_dir)
        print(f"✅ Directory contents: {len(contents)} items")
        
        if contents:
            print("📁 Contents:")
            for item in contents[:10]:  # Show first 10 items
                item_path = os.path.join(audio_dir, item)
                if os.path.isdir(item_path):
                    print(f"  📁 {item}/")
                else:
                    print(f"  📄 {item}")
            
            if len(contents) > 10:
                print(f"  ... and {len(contents) - 10} more items")
        else:
            print("  (empty directory)")
            
    except Exception as e:
        print(f"❌ Error listing directory: {e}")
        return False
    
    # Test file access
    print("\n🎵 Testing audio file access...")
    audio_files_found = 0
    
    for root, dirs, files in os.walk(audio_dir):
        for file in files:
            if file.endswith('.mp3'):
                audio_files_found += 1
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, audio_dir)
                
                print(f"  🎵 Found: {relative_path}")
                
                # Test if file is readable
                if os.access(file_path, os.R_OK):
                    print(f"    ✅ Readable")
                else:
                    print(f"    ❌ Not readable")
                
                # Show file size
                try:
                    size = os.path.getsize(file_path)
                    print(f"    📏 Size: {size} bytes")
                except Exception as e:
                    print(f"    ❌ Error getting size: {e}")
                
                # Only show first 5 files
                if audio_files_found >= 5:
                    break
        
        if audio_files_found >= 5:
            break
    
    print(f"\n📊 Summary:")
    print(f"  Total audio files found: {audio_files_found}")
    
    if audio_files_found > 0:
        print("✅ Audio files are accessible!")
        return True
    else:
        print("⚠️ No audio files found")
        return True  # Directory is accessible, just no files yet

def test_web_access():
    """Test web access to audio files"""
    import requests
    
    print("\n🌐 Testing web access...")
    
    try:
        # Test the base URL
        response = requests.get("http://localhost:5001/ai-audio-translations/", timeout=5)
        print(f"✅ Base URL accessible: {response.status_code}")
        
        # Test if we can list the directory
        if response.status_code == 200:
            print("✅ Web server can serve audio files")
        else:
            print(f"⚠️ Web server returned: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to web server (is it running?)")
    except Exception as e:
        print(f"❌ Error testing web access: {e}")

if __name__ == "__main__":
    print("🚀 Audio Directory Access Test")
    print("=" * 40)
    
    success = test_audio_directory()
    
    if success:
        test_web_access()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Audio directory test completed successfully!")
    else:
        print("❌ Audio directory test failed!")
        sys.exit(1) 