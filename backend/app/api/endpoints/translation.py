from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict
from app.core.database import get_db
from app.services.translation_service import (
    translate_train_route,
    get_train_route_translations,
    bulk_translate_all_routes
)
from app.utils.gcp_client import gcp_client
from app.schemas.translation import (
    TranslationRequest,
    TranslationResponse,
    GetTranslationResponse,
    BulkTranslationRequest,
    BulkTranslationResponse,
    SimpleTranslationRequest,
    SimpleTranslationResponse
)

router = APIRouter()

@router.post("/save/", response_model=TranslationResponse)
def translate_and_save_route(
    request: TranslationRequest,
    db: Session = Depends(get_db)
):
    """
    Translate a train route to all supported languages and save to database
    """
    try:
        # Translate the train route
        translations = translate_train_route(
            db=db,
            train_route_id=request.train_route_id,
            source_lang=request.source_language
        )
        
        return TranslationResponse(
            train_route_id=request.train_route_id,
            translations_saved=True,
            translations=translations,
            timestamp=datetime.utcnow()
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@router.get("/all")
def get_all_translations(db: Session = Depends(get_db)):
    """
    Get all translation records from the database
    """
    try:
        from app.models.train_route_translation import TrainRouteTranslation
        
        translations = db.query(TrainRouteTranslation).all()
        
        return {
            "translations": [
                {
                    "id": t.id,
                    "train_route_id": t.train_route_id,
                    "language_code": t.language_code,
                    "train_number": t.train_number,
                    "train_number_words": t.train_number_words,
                    "train_name": t.train_name,
                    "start_station_name": t.start_station_name,
                    "end_station_name": t.end_station_name
                }
                for t in translations
            ],
            "total": len(translations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get all translations: {str(e)}")

@router.get("/{train_route_id}", response_model=GetTranslationResponse)
def get_route_translations(
    train_route_id: int,
    db: Session = Depends(get_db)
):
    """
    Get translations for a specific train route
    """
    try:
        translations = get_train_route_translations(db, train_route_id)
        
        if not translations:
            raise HTTPException(
                status_code=404, 
                detail=f"No translations found for train route {train_route_id}"
            )
        
        return GetTranslationResponse(
            train_route_id=train_route_id,
            translations=translations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get translations: {str(e)}")

@router.post("/bulk/", response_model=BulkTranslationResponse)
def bulk_translate_routes(
    request: BulkTranslationRequest,
    db: Session = Depends(get_db)
):
    """
    Translate all train routes to all supported languages
    """
    try:
        result = bulk_translate_all_routes(db, request.source_language)
        
        return BulkTranslationResponse(
            total_routes=result["total_routes"],
            translated_routes=result["translated_routes"],
            failed_routes=result["failed_routes"],
            message=result["message"],
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk translation failed: {str(e)}")

@router.post("/simple/", response_model=SimpleTranslationResponse)
def translate_simple_text(
    request: SimpleTranslationRequest,
    db: Session = Depends(get_db)
):
    """
    Translate simple text to all supported languages
    """
    try:
        # Detect language if not provided
        source_lang = request.source_language
        if not source_lang:
            source_lang = gcp_client.detect_language(request.text)
        
        # Define target languages
        target_languages = ['en', 'hi', 'mr', 'gu']
        translations = {}
        
        for lang in target_languages:
            if lang == source_lang:
                translations[lang] = request.text
            else:
                translations[lang] = gcp_client.translate_text(
                    request.text, source_lang, lang
                )
        
        return SimpleTranslationResponse(
            original_text=request.text,
            detected_language=source_lang,
            translations=translations,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@router.delete("/clear-all")
def clear_all_translations(db: Session = Depends(get_db)):
    """Clear all translation records from the database"""
    try:
        from app.models.train_route_translation import TrainRouteTranslation
        
        deleted_count = db.query(TrainRouteTranslation).delete()
        db.commit()
        return {
            "message": f"Successfully cleared {deleted_count} translation records from the database",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing translations: {str(e)}") 