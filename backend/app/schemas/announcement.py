from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime

# Category Schemas
class AnnouncementCategoryBase(BaseModel):
    category_code: str
    description: str

class AnnouncementCategoryCreate(AnnouncementCategoryBase):
    pass

class AnnouncementCategory(AnnouncementCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Template Schemas
class AnnouncementTemplateBase(BaseModel):
    language_code: str
    template_text: str

class AnnouncementTemplateCreate(AnnouncementTemplateBase):
    category_id: int

class AnnouncementTemplateUpdate(BaseModel):
    template_text: str

class AnnouncementTemplate(AnnouncementTemplateBase):
    id: int
    category_id: int
    created_at: datetime
    updated_at: datetime
    has_audio: bool = False

    class Config:
        from_attributes = True

# Audio File Schemas
class AnnouncementAudioFileBase(BaseModel):
    language_code: str
    audio_file_path: str

class AnnouncementAudioFile(AnnouncementAudioFileBase):
    id: int
    template_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Translation Schemas
class TranslationGenerationRequest(BaseModel):
    languages: Optional[List[str]] = None
    overwrite_existing: bool = False

class TranslationGenerationResponse(BaseModel):
    success: bool
    category_id: int
    translations_generated: int
    languages: List[str]
    message: str

class BulkTranslationGenerationRequest(BaseModel):
    languages: Optional[List[str]] = None
    overwrite_existing: bool = False

class BulkTranslationGenerationResponse(BaseModel):
    success: bool
    total_categories: int
    total_translations_generated: int
    categories_processed: List[int]
    message: str

# Audio Generation Schemas
class AudioGenerationRequest(BaseModel):
    languages: Optional[List[str]] = None
    overwrite_existing: bool = False

class AudioGenerationResponse(BaseModel):
    success: bool
    category_id: int
    audio_files_generated: int
    languages: List[str]
    message: str

class BulkAudioGenerationRequest(BaseModel):
    languages: Optional[List[str]] = None
    overwrite_existing: bool = False

class BulkAudioGenerationResponse(BaseModel):
    success: bool
    total_categories: int
    total_audio_files_generated: int
    categories_processed: List[int]
    message: str

# Template Usage Schemas
class AnnouncementGenerationRequest(BaseModel):
    category_code: str
    language_code: str
    parameters: Dict[str, Any]

class AnnouncementGenerationResponse(BaseModel):
    success: bool
    announcement_text: str
    audio_url: Optional[str] = None
    message: str

# Response Schemas
class CategoryWithTemplates(BaseModel):
    category: AnnouncementCategory
    templates: List[AnnouncementTemplate]

class GetAllCategoriesResponse(BaseModel):
    categories: List[AnnouncementCategory]

class GetAllTemplatesResponse(BaseModel):
    templates: List[AnnouncementTemplate]

class GetCategoryTemplatesResponse(BaseModel):
    category: AnnouncementCategory
    templates: List[AnnouncementTemplate] 