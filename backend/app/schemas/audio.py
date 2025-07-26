from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

class AudioFileData(BaseModel):
    id: int
    train_route_id: int
    language_code: str
    audio_type: str
    audio_file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class AudioGenerationRequest(BaseModel):
    train_route_id: int
    languages: Optional[List[str]] = None  # Defaults to all available languages

class AudioGenerationResponse(BaseModel):
    success: bool
    train_route_id: int
    translations_processed: int
    audio_files_generated: int
    languages: List[str]
    audio_types: List[str]
    generated_files: Dict[str, Dict[str, str]]

class BulkAudioGenerationRequest(BaseModel):
    languages: Optional[List[str]] = None
    overwrite_existing: bool = False

class BulkAudioGenerationResponse(BaseModel):
    success: bool
    total_routes_processed: int
    total_files_generated: int
    failed_routes: List[Dict[str, str]]
    summary: Dict[str, int]

class GetAudioFilesResponse(BaseModel):
    success: bool
    audio_files: List[AudioFileData]
    total_count: int

class GetRouteAudioFilesResponse(BaseModel):
    success: bool
    train_route_id: int
    audio_files: List[AudioFileData]

class ClearAudioResponse(BaseModel):
    success: bool
    message: str
    deleted_count: int 