from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.audio_segment_service import AudioSegmentService
from app.schemas.audio_segment import (
    AudioSegmentGenerationRequest,
    AudioSegmentGenerationResponse,
    AudioSegmentBulkGenerationRequest,
    AudioSegmentBulkGenerationResponse,
    GetAudioSegmentsResponse,
    AudioSegment
)

router = APIRouter()
audio_segment_service = AudioSegmentService()

@router.post("/generate/{category_id}", response_model=AudioSegmentGenerationResponse)
async def generate_audio_segments(
    category_id: int,
    request: AudioSegmentGenerationRequest,
    db: Session = Depends(get_db)
):
    """Generate audio segments for a specific category"""
    try:
        result = audio_segment_service.generate_segments_for_category(
            db=db,
            category_id=category_id,
            languages=request.languages,
            overwrite_existing=request.overwrite_existing
        )
        
        return AudioSegmentGenerationResponse(
            message=f"Generated {result['total_generated']} audio segments for category {category_id}",
            total_segments_generated=result['total_generated'],
            total_categories=1,
            generated_segments=result['generated_segments'],
            failed_segments=result['failed_segments']
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audio segments: {str(e)}")

@router.post("/generate-bulk", response_model=AudioSegmentBulkGenerationResponse)
async def generate_audio_segments_bulk(
    request: AudioSegmentBulkGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generate audio segments for all categories"""
    try:
        result = audio_segment_service.generate_segments_for_all_categories(
            db=db,
            languages=request.languages,
            overwrite_existing=request.overwrite_existing
        )
        
        return AudioSegmentBulkGenerationResponse(
            message=f"Generated {result['total_generated']} audio segments across {len(result['categories_processed'])} categories",
            total_segments_generated=result['total_generated'],
            total_categories=len(result['categories_processed']),
            categories_processed=result['categories_processed'],
            failed_categories=result['failed_categories']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audio segments: {str(e)}")

@router.get("/all", response_model=GetAudioSegmentsResponse)
async def get_all_audio_segments(
    db: Session = Depends(get_db)
):
    """Get all audio segments across all categories"""
    try:
        segments = audio_segment_service.get_all_segments(db)
        return GetAudioSegmentsResponse(
            segments=segments,
            total_count=len(segments)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audio segments: {str(e)}")

@router.get("/{category_id}", response_model=GetAudioSegmentsResponse)
async def get_audio_segments(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Get all audio segments for a specific category"""
    try:
        segments = audio_segment_service.get_segments_for_category(db, category_id)
        return GetAudioSegmentsResponse(
            segments=segments,
            total_count=len(segments)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audio segments: {str(e)}")

@router.get("/{category_id}/{language_code}", response_model=GetAudioSegmentsResponse)
async def get_audio_segments_by_language(
    category_id: int,
    language_code: str,
    db: Session = Depends(get_db)
):
    """Get audio segments for a specific category and language"""
    try:
        segments = audio_segment_service.get_segments_by_language(db, category_id, language_code)
        return GetAudioSegmentsResponse(
            segments=segments,
            total_count=len(segments)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audio segments: {str(e)}")

@router.delete("/clear-all")
async def clear_all_audio_segments(
    db: Session = Depends(get_db)
):
    """Delete all audio segments from all categories"""
    try:
        success = audio_segment_service.clear_all_segments(db)
        if success:
            return {"message": "Successfully deleted all audio segments from all categories"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete all audio segments")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete all audio segments: {str(e)}")

@router.get("/{category_id}/availability")
async def get_segment_availability(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Get segment availability statistics for a category"""
    try:
        availability = audio_segment_service.get_segment_availability(db, category_id)
        return {
            "category_id": category_id,
            "availability": availability
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get segment availability: {str(e)}")

@router.delete("/{category_id}")
async def delete_audio_segments(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Delete all audio segments for a category"""
    try:
        success = audio_segment_service.delete_segments_for_category(db, category_id)
        if success:
            return {"message": f"Successfully deleted all audio segments for category {category_id}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete audio segments")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete audio segments: {str(e)}") 