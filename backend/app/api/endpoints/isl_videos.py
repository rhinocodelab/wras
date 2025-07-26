from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import os
import json
from pathlib import Path

router = APIRouter()

@router.get("/")
async def get_isl_videos():
    """Get all ISL videos by scanning the directory"""
    try:
        isl_dir = "/var/www/war-ddh/isl_dataset"
        videos = []
        
        if not os.path.exists(isl_dir):
            raise HTTPException(status_code=404, detail="ISL dataset directory not found")
        
        # Scan the directory for video files
        for item in os.listdir(isl_dir):
            item_path = os.path.join(isl_dir, item)
            
            # Check if it's a directory
            if os.path.isdir(item_path):
                # Look for MP4 files in the subdirectory
                for file in os.listdir(item_path):
                    if file.endswith('.mp4'):
                        video_path = os.path.join(item, file)
                        
                        # Determine category based on directory name
                        category = determine_category(item)
                        
                        # Create video name from filename (remove .mp4 extension)
                        video_name = file.replace('.mp4', '').replace('_', ' ').title()
                        
                        videos.append({
                            "category": category,
                            "name": video_name,
                            "filename": file,
                            "path": video_path,
                            "size": get_file_size(os.path.join(item_path, file))
                        })
        
        # Sort videos by category and name
        videos.sort(key=lambda x: (x["category"], x["name"]))
        
        return {
            "videos": videos,
            "total": len(videos),
            "categories": list(set(v["category"] for v in videos))
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning ISL dataset: {str(e)}")

def determine_category(directory_name: str) -> str:
    """Determine the category based on directory name"""
    directory_lower = directory_name.lower()
    
    # Numbers
    if directory_name.isdigit() or directory_lower in ['one', 'two', 'three', 'four', 'five']:
        return 'numbers'
    
    # Train terms
    if directory_lower in ['train', 'platform', 'station', 'express', 'running']:
        return 'train_terms'
    
    # Status terms
    if directory_lower in ['arrive', 'arriving', 'late', 'cancelled', 'attention', 'delayed', 'on_time']:
        return 'status_terms'
    
    # Station names
    if directory_lower in ['bandra', 'vapi', 'new_delhi', 'mumbai_central', 'chennai_central', 'kolkata']:
        return 'station_names'
    
    # Other
    if directory_lower in ['number', 'welcome', 'thank_you', 'goodbye']:
        return 'other'
    
    # Default to 'other' for unknown categories
    return 'other'

def get_file_size(file_path: str) -> int:
    """Get file size in bytes"""
    try:
        return os.path.getsize(file_path)
    except:
        return 0 