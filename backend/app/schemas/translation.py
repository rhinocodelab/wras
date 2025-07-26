from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class TranslationRequest(BaseModel):
    train_route_id: int
    source_language: Optional[str] = "en"

class TranslationResponse(BaseModel):
    train_route_id: int
    translations_saved: bool
    translations: Dict[str, Dict[str, str]]
    timestamp: datetime

class TranslationData(BaseModel):
    train_number: str
    train_number_words: str
    train_name: str
    start_station_name: str
    end_station_name: str

class GetTranslationResponse(BaseModel):
    train_route_id: int
    translations: Dict[str, TranslationData]

class BulkTranslationRequest(BaseModel):
    source_language: Optional[str] = "en"

class BulkTranslationResponse(BaseModel):
    total_routes: int
    translated_routes: int
    failed_routes: int
    message: str
    timestamp: datetime

class SimpleTranslationRequest(BaseModel):
    text: str
    source_language: Optional[str] = None

class SimpleTranslationResponse(BaseModel):
    original_text: str
    detected_language: str
    translations: Dict[str, str]
    timestamp: datetime 