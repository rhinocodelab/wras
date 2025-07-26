from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.audio_service import audio_service
from app.schemas.audio import (
    AudioGenerationRequest,
    AudioGenerationResponse,
    BulkAudioGenerationRequest,
    BulkAudioGenerationResponse,
    GetAudioFilesResponse,
    GetRouteAudioFilesResponse,
    ClearAudioResponse,
    AudioFileData
)

router = APIRouter()

@router.post("/generate/", response_model=AudioGenerationResponse)
def generate_audio_for_route(request: AudioGenerationRequest, db: Session = Depends(get_db)):
    """Generate audio files for a specific train route using existing text translations"""
    try:
        result = audio_service.generate_audio_for_route(
            db=db,
            train_route_id=request.train_route_id,
            languages=request.languages
        )
        return AudioGenerationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-bulk/", response_model=BulkAudioGenerationResponse)
def generate_audio_for_all_routes(request: BulkAudioGenerationRequest, db: Session = Depends(get_db)):
    """Generate audio files for all train routes that have text translations"""
    try:
        result = audio_service.generate_audio_for_all_routes(
            db=db,
            languages=request.languages,
            overwrite_existing=request.overwrite_existing
        )
        return BulkAudioGenerationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/files/", response_model=GetAudioFilesResponse)
def get_all_audio_files(db: Session = Depends(get_db)):
    """Get all audio files from the database"""
    try:
        audio_files = audio_service.get_all_audio_files(db)
        return GetAudioFilesResponse(
            success=True,
            audio_files=[AudioFileData.from_orm(af) for af in audio_files],
            total_count=len(audio_files)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching audio files: {str(e)}")

@router.get("/files/{train_route_id}", response_model=GetRouteAudioFilesResponse)
def get_audio_files_for_route(train_route_id: int, db: Session = Depends(get_db)):
    """Get all audio files for a specific train route"""
    try:
        audio_files = audio_service.get_audio_files_for_route(db, train_route_id)
        return GetRouteAudioFilesResponse(
            success=True,
            train_route_id=train_route_id,
            audio_files=[AudioFileData.from_orm(af) for af in audio_files]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching audio files: {str(e)}")

@router.delete("/files/{train_route_id}")
def delete_audio_files_for_route(train_route_id: int, db: Session = Depends(get_db)):
    """Delete all audio files for a specific train route"""
    try:
        deleted_count = audio_service.delete_audio_files_for_route(db, train_route_id)
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} audio files for train route {train_route_id}",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting audio files: {str(e)}")

@router.delete("/clear-all/", response_model=ClearAudioResponse)
def clear_all_audio_files(db: Session = Depends(get_db)):
    """Delete all audio files from the database and filesystem"""
    try:
        deleted_count = audio_service.clear_all_audio_files(db)
        return ClearAudioResponse(
            success=True,
            message=f"Successfully cleared {deleted_count} audio files from the database",
            deleted_count=deleted_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing audio files: {str(e)}") 