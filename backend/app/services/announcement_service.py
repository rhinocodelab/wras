import re
import os
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.announcement_category import AnnouncementCategory
from app.models.announcement_template import AnnouncementTemplate
from app.models.announcement_audio_file import AnnouncementAudioFile
from app.models.generated_announcement import GeneratedAnnouncement
from app.utils.gcp_client import gcp_client
from app.utils.gcp_tts_client import gcp_tts_client

class AnnouncementService:
    def __init__(self):
        self.audio_base_path = "/var/www/war-ddh/ai-audio-translations/announcements"
        self.default_languages = ['en', 'hi', 'mr', 'gu']
        
        # Default English templates
        self.default_templates = {
            'arriving': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is arriving at platform number {platform}",
            'delay': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is delayed by {delay_time} minutes. We apologize for the inconvenience.",
            'cancelled': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} scheduled for today has been cancelled. We apologize for the inconvenience",
            'platform_change': "Attention Please! The platform for train number {train_number} {train_name} from {start_station} to {end_station} has been changed to platform number {platform}."
        }

    def initialize_categories_and_templates(self, db: Session) -> Dict:
        """Initialize default categories and English templates"""
        try:
            # Create categories
            categories_created = 0
            templates_created = 0
            
            for category_code, description in [
                ('arriving', 'Train arrival announcements'),
                ('delay', 'Train delay announcements'),
                ('cancelled', 'Train cancellation announcements'),
                ('platform_change', 'Platform change announcements')
            ]:
                # Check if category exists
                existing_category = db.query(AnnouncementCategory).filter(
                    AnnouncementCategory.category_code == category_code
                ).first()
                
                if not existing_category:
                    category = AnnouncementCategory(
                        category_code=category_code,
                        description=description
                    )
                    db.add(category)
                    db.flush()  # Get the ID
                    categories_created += 1
                else:
                    category = existing_category
                
                # Check if English template exists
                existing_template = db.query(AnnouncementTemplate).filter(
                    AnnouncementTemplate.category_id == category.id,
                    AnnouncementTemplate.language_code == 'en'
                ).first()
                
                if not existing_template:
                    template = AnnouncementTemplate(
                        category_id=category.id,
                        language_code='en',
                        template_text=self.default_templates[category_code]
                    )
                    db.add(template)
                    templates_created += 1
            
            db.commit()
            
            return {
                "success": True,
                "categories_created": categories_created,
                "templates_created": templates_created,
                "message": f"Initialized {categories_created} categories and {templates_created} templates"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": str(e)
            }

    def get_all_categories(self, db: Session) -> List[AnnouncementCategory]:
        """Get all announcement categories"""
        return db.query(AnnouncementCategory).all()

    def get_category_by_id(self, db: Session, category_id: int) -> Optional[AnnouncementCategory]:
        """Get category by ID"""
        return db.query(AnnouncementCategory).filter(AnnouncementCategory.id == category_id).first()

    def get_category_by_code(self, db: Session, category_code: str) -> Optional[AnnouncementCategory]:
        """Get category by code"""
        return db.query(AnnouncementCategory).filter(AnnouncementCategory.category_code == category_code).first()

    def get_templates_by_category(self, db: Session, category_id: int) -> List[AnnouncementTemplate]:
        """Get all templates for a category"""
        templates = db.query(AnnouncementTemplate).filter(
            AnnouncementTemplate.category_id == category_id
        ).all()
        
        # Add has_audio flag
        for template in templates:
            audio_file = db.query(AnnouncementAudioFile).filter(
                AnnouncementAudioFile.template_id == template.id
            ).first()
            template.has_audio = audio_file is not None
        
        return templates

    def get_all_templates(self, db: Session) -> List[AnnouncementTemplate]:
        """Get all templates"""
        templates = db.query(AnnouncementTemplate).all()
        
        # Add has_audio flag
        for template in templates:
            audio_file = db.query(AnnouncementAudioFile).filter(
                AnnouncementAudioFile.template_id == template.id
            ).first()
            template.has_audio = audio_file is not None
        
        return templates

    def update_template(self, db: Session, template_id: int, template_text: str) -> Optional[AnnouncementTemplate]:
        """Update template text"""
        template = db.query(AnnouncementTemplate).filter(AnnouncementTemplate.id == template_id).first()
        if template:
            template.template_text = template_text
            db.commit()
        return template

    def _extract_placeholders(self, text: str) -> List[str]:
        """Extract placeholders from template text"""
        pattern = r'\{[^}]+\}'
        return re.findall(pattern, text)

    def _replace_placeholders_for_translation(self, text: str) -> Tuple[str, Dict[str, str]]:
        """Replace placeholders with temporary text for translation"""
        placeholders = self._extract_placeholders(text)
        placeholder_map = {}
        translated_text = text
        
        for i, placeholder in enumerate(placeholders):
            temp_marker = f"PLACEHOLDER_{i}"
            placeholder_map[temp_marker] = placeholder
            translated_text = translated_text.replace(placeholder, temp_marker)
        
        return translated_text, placeholder_map

    def _restore_placeholders(self, text: str, placeholder_map: Dict[str, str]) -> str:
        """Restore placeholders in translated text"""
        restored_text = text
        for temp_marker, placeholder in placeholder_map.items():
            restored_text = restored_text.replace(temp_marker, placeholder)
        return restored_text

    def generate_translations_for_category(self, db: Session, category_id: int, languages: Optional[List[str]] = None, overwrite_existing: bool = False) -> Dict:
        """Generate AI translations for a specific category"""
        try:
            if languages is None:
                languages = ['hi', 'mr', 'gu']  # Exclude English as it's the base
            
            # Get English template
            english_template = db.query(AnnouncementTemplate).filter(
                AnnouncementTemplate.category_id == category_id,
                AnnouncementTemplate.language_code == 'en'
            ).first()
            
            if not english_template:
                return {"success": False, "error": "English template not found for this category"}
            
            translations_generated = 0
            
            for lang_code in languages:
                # Check if translation already exists
                existing_template = db.query(AnnouncementTemplate).filter(
                    AnnouncementTemplate.category_id == category_id,
                    AnnouncementTemplate.language_code == lang_code
                ).first()
                
                if existing_template and not overwrite_existing:
                    continue
                
                # Prepare text for translation
                text_for_translation, placeholder_map = self._replace_placeholders_for_translation(english_template.template_text)
                
                # Translate text
                translated_text = gcp_client.translate_text(text_for_translation, 'en', lang_code)
                
                # Restore placeholders
                final_text = self._restore_placeholders(translated_text, placeholder_map)
                
                # Save or update template
                if existing_template:
                    existing_template.template_text = final_text
                else:
                    new_template = AnnouncementTemplate(
                        category_id=category_id,
                        language_code=lang_code,
                        template_text=final_text
                    )
                    db.add(new_template)
                
                translations_generated += 1
            
            db.commit()
            
            return {
                "success": True,
                "category_id": category_id,
                "translations_generated": translations_generated,
                "languages": languages,
                "message": f"Successfully generated {translations_generated} translations"
            }
            
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}

    def generate_translations_for_all_categories(self, db: Session, languages: Optional[List[str]] = None, overwrite_existing: bool = False) -> Dict:
        """Generate AI translations for all categories"""
        try:
            categories = self.get_all_categories(db)
            total_translations = 0
            categories_processed = []
            
            for category in categories:
                result = self.generate_translations_for_category(db, category.id, languages, overwrite_existing)
                if result["success"]:
                    total_translations += result["translations_generated"]
                    categories_processed.append(category.id)
            
            return {
                "success": True,
                "total_categories": len(categories),
                "total_translations_generated": total_translations,
                "categories_processed": categories_processed,
                "message": f"Generated {total_translations} translations across {len(categories_processed)} categories"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def generate_audio_for_category(self, db: Session, category_id: int, languages: Optional[List[str]] = None, overwrite_existing: bool = False) -> Dict:
        """Generate AI audio for a specific category"""
        try:
            if languages is None:
                languages = self.default_languages
            
            # Get templates for the category
            templates = db.query(AnnouncementTemplate).filter(
                AnnouncementTemplate.category_id == category_id,
                AnnouncementTemplate.language_code.in_(languages)
            ).all()
            
            audio_files_generated = 0
            
            for template in templates:
                # Check if audio already exists
                existing_audio = db.query(AnnouncementAudioFile).filter(
                    AnnouncementAudioFile.template_id == template.id
                ).first()
                
                if existing_audio and not overwrite_existing:
                    continue
                
                # Create directory structure
                category = self.get_category_by_id(db, category_id)
                audio_dir = os.path.join(self.audio_base_path, category.category_code, template.language_code)
                os.makedirs(audio_dir, exist_ok=True)
                
                # Generate audio file
                audio_filename = f"{category.category_code}_{template.language_code}.mp3"
                audio_file_path = os.path.join(audio_dir, audio_filename)
                
                success = gcp_tts_client.generate_audio(
                    text=template.template_text,
                    language_code=template.language_code,
                    output_path=audio_file_path
                )
                
                if success:
                    # Save or update audio file record
                    if existing_audio:
                        # Delete old file if exists
                        if os.path.exists(existing_audio.audio_file_path):
                            os.remove(existing_audio.audio_file_path)
                        existing_audio.audio_file_path = audio_file_path
                    else:
                        new_audio = AnnouncementAudioFile(
                            template_id=template.id,
                            language_code=template.language_code,
                            audio_file_path=audio_file_path
                        )
                        db.add(new_audio)
                    
                    audio_files_generated += 1
            
            db.commit()
            
            return {
                "success": True,
                "category_id": category_id,
                "audio_files_generated": audio_files_generated,
                "languages": languages,
                "message": f"Successfully generated {audio_files_generated} audio files"
            }
            
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}

    def generate_audio_for_all_categories(self, db: Session, languages: Optional[List[str]] = None, overwrite_existing: bool = False) -> Dict:
        """Generate AI audio for all categories"""
        try:
            categories = self.get_all_categories(db)
            total_audio_files = 0
            categories_processed = []
            
            for category in categories:
                result = self.generate_audio_for_category(db, category.id, languages, overwrite_existing)
                if result["success"]:
                    total_audio_files += result["audio_files_generated"]
                    categories_processed.append(category.id)
            
            return {
                "success": True,
                "total_categories": len(categories),
                "total_audio_files_generated": total_audio_files,
                "categories_processed": categories_processed,
                "message": f"Generated {total_audio_files} audio files across {len(categories_processed)} categories"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def generate_announcement(self, db: Session, category_code: str, language_code: str, parameters: Dict[str, any]) -> Dict:
        """Generate actual announcement with filled parameters"""
        try:
            # Get category
            category = self.get_category_by_code(db, category_code)
            if not category:
                return {"success": False, "error": "Category not found"}
            
            # Get template
            template = db.query(AnnouncementTemplate).filter(
                AnnouncementTemplate.category_id == category.id,
                AnnouncementTemplate.language_code == language_code
            ).first()
            
            if not template:
                return {"success": False, "error": f"Template not found for language {language_code}"}
            
            # Generate announcement text by replacing placeholders
            announcement_text = template.template_text
            for placeholder, value in parameters.items():
                announcement_text = announcement_text.replace(f"{{{placeholder}}}", str(value))
            
            # Check if any placeholders are still in the text
            remaining_placeholders = self._extract_placeholders(announcement_text)
            if remaining_placeholders:
                return {
                    "success": False, 
                    "error": f"Missing parameters: {', '.join(remaining_placeholders)}"
                }
            
            # Save generated announcement
            generated_announcement = GeneratedAnnouncement(
                category_id=category.id,
                language_code=language_code,
                parameters_json=parameters,
                generated_text=announcement_text
            )
            db.add(generated_announcement)
            db.commit()
            
            # Get audio URL if available
            audio_url = None
            audio_file = db.query(AnnouncementAudioFile).filter(
                AnnouncementAudioFile.template_id == template.id
            ).first()
            
            if audio_file:
                # Convert file path to web-accessible URL
                relative_path = audio_file.audio_file_path.replace('/var/www/war-ddh/ai-audio-translations/', '')
                audio_url = f"/ai-audio-translations/{relative_path}"
            
            return {
                "success": True,
                "announcement_text": announcement_text,
                "audio_url": audio_url,
                "message": "Announcement generated successfully"
            }
            
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}

# Create service instance
announcement_service = AnnouncementService() 