from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AudioSegmentBase(BaseModel):
    segment_name: str
    segment_text: str
    language_code: str
    audio_file_path: str
    audio_duration: Optional[float] = None

class AudioSegmentCreate(AudioSegmentBase):
    category_id: int

class AudioSegmentUpdate(BaseModel):
    segment_text: Optional[str] = None
    audio_file_path: Optional[str] = None
    audio_duration: Optional[float] = None

class AudioSegment(AudioSegmentBase):
    id: int
    category_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AudioSegmentGenerationRequest(BaseModel):
    languages: List[str] = ["en", "hi", "mr", "gu"]
    overwrite_existing: bool = False

class AudioSegmentGenerationResponse(BaseModel):
    message: str
    total_segments_generated: int
    total_categories: int
    generated_segments: List[AudioSegment]
    failed_segments: List[str]

class GetAudioSegmentsResponse(BaseModel):
    segments: List[AudioSegment]
    total_count: int

class AudioSegmentBulkGenerationRequest(BaseModel):
    languages: List[str] = ["en", "hi", "mr", "gu"]
    overwrite_existing: bool = False

class AudioSegmentBulkGenerationResponse(BaseModel):
    message: str
    total_segments_generated: int
    total_categories: int
    categories_processed: List[str]
    failed_categories: List[str] 