from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.announcement_service import announcement_service
from app.schemas.announcement import (
    GetAllCategoriesResponse,
    GetAllTemplatesResponse,
    GetCategoryTemplatesResponse,
    AnnouncementTemplateUpdate,
    TranslationGenerationRequest,
    TranslationGenerationResponse,
    BulkTranslationGenerationRequest,
    BulkTranslationGenerationResponse,
    AudioGenerationRequest,
    AudioGenerationResponse,
    BulkAudioGenerationRequest,
    BulkAudioGenerationResponse,
    AnnouncementGenerationRequest,
    AnnouncementGenerationResponse
)

router = APIRouter()

@router.get("/categories/", response_model=GetAllCategoriesResponse)
def get_all_categories(db: Session = Depends(get_db)):
    """Get all announcement categories"""
    try:
        categories = announcement_service.get_all_categories(db)
        return GetAllCategoriesResponse(categories=categories)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

@router.get("/templates/", response_model=GetAllTemplatesResponse)
def get_all_templates(db: Session = Depends(get_db)):
    """Get all announcement templates"""
    try:
        templates = announcement_service.get_all_templates(db)
        return GetAllTemplatesResponse(templates=templates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching templates: {str(e)}")

@router.get("/templates/{category_id}", response_model=GetCategoryTemplatesResponse)
def get_templates_by_category(category_id: int, db: Session = Depends(get_db)):
    """Get all templates for a specific category"""
    try:
        category = announcement_service.get_category_by_id(db, category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        templates = announcement_service.get_templates_by_category(db, category_id)
        return GetCategoryTemplatesResponse(category=category, templates=templates)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching templates: {str(e)}")

@router.put("/templates/{template_id}")
def update_template(template_id: int, template_update: AnnouncementTemplateUpdate, db: Session = Depends(get_db)):
    """Update template text"""
    try:
        template = announcement_service.update_template(db, template_id, template_update.template_text)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {
            "success": True,
            "template": {
                "id": template.id,
                "language_code": template.language_code,
                "template_text": template.template_text
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating template: {str(e)}")

@router.post("/generate-translations/{category_id}", response_model=TranslationGenerationResponse)
def generate_translations_for_category(
    category_id: int, 
    request: TranslationGenerationRequest, 
    db: Session = Depends(get_db)
):
    """Generate AI translations for a specific category"""
    try:
        result = announcement_service.generate_translations_for_category(
            db, 
            category_id, 
            request.languages, 
            request.overwrite_existing
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return TranslationGenerationResponse(
            success=True,
            category_id=result["category_id"],
            translations_generated=result["translations_generated"],
            languages=result["languages"],
            message=result["message"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating translations: {str(e)}")

@router.post("/generate-translations/", response_model=BulkTranslationGenerationResponse)
def generate_translations_for_all_categories(
    request: BulkTranslationGenerationRequest, 
    db: Session = Depends(get_db)
):
    """Generate AI translations for all categories"""
    try:
        result = announcement_service.generate_translations_for_all_categories(
            db, 
            request.languages, 
            request.overwrite_existing
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return BulkTranslationGenerationResponse(
            success=True,
            total_categories=result["total_categories"],
            total_translations_generated=result["total_translations_generated"],
            categories_processed=result["categories_processed"],
            message=result["message"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating translations: {str(e)}")

@router.post("/generate-audio/{category_id}", response_model=AudioGenerationResponse)
def generate_audio_for_category(
    category_id: int, 
    request: AudioGenerationRequest, 
    db: Session = Depends(get_db)
):
    """Generate AI audio for a specific category"""
    try:
        result = announcement_service.generate_audio_for_category(
            db, 
            category_id, 
            request.languages, 
            request.overwrite_existing
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return AudioGenerationResponse(
            success=True,
            category_id=result["category_id"],
            audio_files_generated=result["audio_files_generated"],
            languages=result["languages"],
            message=result["message"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

@router.post("/generate-audio/", response_model=BulkAudioGenerationResponse)
def generate_audio_for_all_categories(
    request: BulkAudioGenerationRequest, 
    db: Session = Depends(get_db)
):
    """Generate AI audio for all categories"""
    try:
        result = announcement_service.generate_audio_for_all_categories(
            db, 
            request.languages, 
            request.overwrite_existing
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return BulkAudioGenerationResponse(
            success=True,
            total_categories=result["total_categories"],
            total_audio_files_generated=result["total_audio_files_generated"],
            categories_processed=result["categories_processed"],
            message=result["message"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

@router.post("/generate", response_model=AnnouncementGenerationResponse)
def generate_announcement(request: AnnouncementGenerationRequest, db: Session = Depends(get_db)):
    """Generate actual announcement with filled parameters"""
    try:
        result = announcement_service.generate_announcement(
            db, 
            request.category_code, 
            request.language_code, 
            request.parameters
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return AnnouncementGenerationResponse(
            success=True,
            announcement_text=result["announcement_text"],
            audio_url=result.get("audio_url"),
            message=result["message"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating announcement: {str(e)}")

@router.post("/initialize/")
def initialize_categories_and_templates(db: Session = Depends(get_db)):
    """Initialize default categories and English templates"""
    try:
        result = announcement_service.initialize_categories_and_templates(db)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "categories_created": result["categories_created"],
            "templates_created": result["templates_created"],
            "message": result["message"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing categories and templates: {str(e)}")

@router.post("/seed-translations/")
def seed_translations_using_script(db: Session = Depends(get_db)):
    """Run seed_database.sh script to generate translations"""
    try:
        import subprocess
        import os
        
        # Get the backend directory path
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        script_path = os.path.join(backend_dir, "seed_database.sh")
        
        # Check if script exists
        if not os.path.exists(script_path):
            raise HTTPException(status_code=404, detail="seed_database.sh script not found")
        
        # Make script executable
        os.chmod(script_path, 0o755)
        
        # Run the script
        result = subprocess.run(
            [script_path],
            capture_output=True,
            text=True,
            cwd=backend_dir,
            env={**os.environ, 'PYTHONPATH': backend_dir}
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500, 
                detail=f"Script execution failed: {result.stderr}"
            )
        
        # Get the number of categories from database
        categories = announcement_service.get_all_categories(db)
        
        return {
            "success": True,
            "total_categories": len(categories),
            "message": "Seed database script executed successfully",
            "script_output": result.stdout
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running seed database script: {str(e)}") 