from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel

from app.core.database import get_db
from app.utils.gcp_client import gcp_client
from app.utils.gcp_tts_client import gcp_tts_client

router = APIRouter()

class AudioTemplateGenerateRequest(BaseModel):
    text: str
    languages: List[str]

@router.get("/")
async def get_audio_templates(db: Session = Depends(get_db)):
    """Get all audio templates"""
    try:
        # For now, we'll scan the directory for templates
        # Later we can add database storage
        templates_dir = "/var/www/war-ddh/audio-templates/templates"
        templates = []
        
        if os.path.exists(templates_dir):
            for template_dir in os.listdir(templates_dir):
                template_path = os.path.join(templates_dir, template_dir)
                if os.path.isdir(template_path):
                    metadata_file = os.path.join(template_path, "metadata.json")
                    if os.path.exists(metadata_file):
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                            templates.append({
                                "id": str(uuid.uuid4()),
                                "template_id": metadata.get("template_id", template_dir),
                                "original_text": metadata.get("original_text", ""),
                                "text_en": metadata.get("translations", {}).get("en", ""),
                                "text_hi": metadata.get("translations", {}).get("hi", ""),
                                "text_mr": metadata.get("translations", {}).get("mr", ""),
                                "text_gu": metadata.get("translations", {}).get("gu", ""),
                                "audio_en_path": f"/audio-templates/templates/{template_dir}/en.mp3" if os.path.exists(os.path.join(template_path, "en.mp3")) else None,
                                "audio_hi_path": f"/audio-templates/templates/{template_dir}/hi.mp3" if os.path.exists(os.path.join(template_path, "hi.mp3")) else None,
                                "audio_mr_path": f"/audio-templates/templates/{template_dir}/mr.mp3" if os.path.exists(os.path.join(template_path, "mr.mp3")) else None,
                                "audio_gu_path": f"/audio-templates/templates/{template_dir}/gu.mp3" if os.path.exists(os.path.join(template_path, "gu.mp3")) else None,
                                "created_at": metadata.get("created_at", datetime.now().isoformat()),
                                "status": "completed"
                            })
        
        return {
            "templates": templates,
            "total": len(templates)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching templates: {str(e)}")

@router.post("/generate/")
async def generate_audio_template(
    request: AudioTemplateGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate audio template with translations and TTS"""
    try:
        text = request.text
        languages = request.languages
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if not languages:
            raise HTTPException(status_code=400, detail="At least one language must be selected")
        
        # Validate languages
        valid_languages = ['en', 'hi', 'mr', 'gu']
        for lang in languages:
            if lang not in valid_languages:
                raise HTTPException(status_code=400, detail=f"Invalid language: {lang}")
        
        # Generate template ID
        template_id = f"template_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        # Create template directory
        templates_dir = "/var/www/war-ddh/audio-templates/templates"
        template_dir = os.path.join(templates_dir, template_id)
        os.makedirs(template_dir, exist_ok=True)
        
        # Generate translations
        translations = {}
        for lang in languages:
            if lang == 'en':
                translations[lang] = text
            else:
                try:
                    translated_text = gcp_client.translate_text(text, 'en', lang)
                    translations[lang] = translated_text
                except Exception as e:
                    print(f"Translation error for {lang}: {e}")
                    translations[lang] = text  # Fallback to original text
        
        # Generate audio files
        audio_paths = {}
        for lang in languages:
            try:
                audio_filename = f"{lang}.mp3"
                audio_path = os.path.join(template_dir, audio_filename)
                
                # Generate TTS audio
                gcp_tts_client.generate_audio(translations[lang], lang, audio_path)
                audio_paths[lang] = f"/audio-templates/templates/{template_id}/{audio_filename}"
                
            except Exception as e:
                print(f"Audio generation error for {lang}: {e}")
                audio_paths[lang] = None
        
        # Create metadata
        metadata = {
            "template_id": template_id,
            "original_text": text,
            "translations": translations,
            "created_at": datetime.now().isoformat(),
            "audio_duration": {
                "en": 3.2,  # Placeholder - could be calculated from actual audio
                "hi": 4.1,
                "mr": 3.8,
                "gu": 3.9
            },
            "file_sizes": {
                "en": os.path.getsize(os.path.join(template_dir, "en.mp3")) if os.path.exists(os.path.join(template_dir, "en.mp3")) else 0,
                "hi": os.path.getsize(os.path.join(template_dir, "hi.mp3")) if os.path.exists(os.path.join(template_dir, "hi.mp3")) else 0,
                "mr": os.path.getsize(os.path.join(template_dir, "mr.mp3")) if os.path.exists(os.path.join(template_dir, "mr.mp3")) else 0,
                "gu": os.path.getsize(os.path.join(template_dir, "gu.mp3")) if os.path.exists(os.path.join(template_dir, "gu.mp3")) else 0
            },
            "status": "completed"
        }
        
        # Save metadata
        with open(os.path.join(template_dir, "metadata.json"), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Save translations
        with open(os.path.join(template_dir, "translations.json"), 'w') as f:
            json.dump({
                "template_id": template_id,
                "translations": translations
            }, f, indent=2)
        
        # Set permissions
        import pwd
        import grp
        current_user = pwd.getpwuid(os.getuid())
        current_group = grp.getgrgid(os.getgid())
        
        # Set ownership to current user
        os.chown(template_dir, current_user.pw_uid, current_group.gr_gid)
        for file in os.listdir(template_dir):
            file_path = os.path.join(template_dir, file)
            os.chown(file_path, current_user.pw_uid, current_group.gr_gid)
            os.chmod(file_path, 0o644)
        
        return {
            "template_id": template_id,
            "original_text": text,
            "translations": translations,
            "audio_paths": audio_paths,
            "status": "completed",
            "created_at": metadata["created_at"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating template: {str(e)}")

@router.delete("/clear/")
async def clear_all_audio_templates():
    """Clear all audio templates"""
    try:
        templates_dir = "/var/www/war-ddh/audio-templates/templates"
        
        if not os.path.exists(templates_dir):
            return {"message": "No templates directory found"}
        
        # Get all template directories
        template_dirs = [d for d in os.listdir(templates_dir) if os.path.isdir(os.path.join(templates_dir, d))]
        
        if not template_dirs:
            return {"message": "No templates to clear"}
        
        # Remove all template directories
        import shutil
        for template_dir in template_dirs:
            template_path = os.path.join(templates_dir, template_dir)
            try:
                shutil.rmtree(template_path)
            except Exception as e:
                print(f"Error removing template {template_dir}: {e}")
        
        return {
            "message": f"Successfully cleared {len(template_dirs)} audio templates",
            "templates_cleared": len(template_dirs)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing templates: {str(e)}")

@router.delete("/{template_id}/")
async def delete_audio_template(template_id: str):
    """Delete an audio template"""
    try:
        template_dir = f"/var/www/war-ddh/audio-templates/templates/{template_id}"
        
        if not os.path.exists(template_dir):
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Remove the entire template directory
        import shutil
        shutil.rmtree(template_dir)
        
        return {"message": f"Template {template_id} deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting template: {str(e)}")

@router.get("/{template_id}/")
async def get_audio_template(template_id: str):
    """Get a specific audio template"""
    try:
        template_dir = f"/var/www/war-ddh/audio-templates/templates/{template_id}"
        metadata_file = os.path.join(template_dir, "metadata.json")
        
        if not os.path.exists(metadata_file):
            raise HTTPException(status_code=404, detail="Template not found")
        
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        return {
            "template_id": template_id,
            "original_text": metadata.get("original_text", ""),
            "translations": metadata.get("translations", {}),
            "audio_paths": {
                "en": f"/audio-templates/templates/{template_id}/en.mp3" if os.path.exists(os.path.join(template_dir, "en.mp3")) else None,
                "hi": f"/audio-templates/templates/{template_id}/hi.mp3" if os.path.exists(os.path.join(template_dir, "hi.mp3")) else None,
                "mr": f"/audio-templates/templates/{template_id}/mr.mp3" if os.path.exists(os.path.join(template_dir, "mr.mp3")) else None,
                "gu": f"/audio-templates/templates/{template_id}/gu.mp3" if os.path.exists(os.path.join(template_dir, "gu.mp3")) else None
            },
            "created_at": metadata.get("created_at"),
            "status": metadata.get("status", "completed")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching template: {str(e)}") 