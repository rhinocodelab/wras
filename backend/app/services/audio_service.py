import os
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.audio_file import AudioFile
from app.models.train_route_translation import TrainRouteTranslation
from app.models.train_route import TrainRoute
from app.utils.gcp_tts_client import gcp_tts_client

class AudioService:
    def __init__(self):
        self.audio_base_path = "/var/www/war-ddh/ai-audio-translations"
        self.audio_types = [
            'train_number_words',
            'train_name', 
            'start_station_name',
            'end_station_name'
        ]

    def generate_audio_for_route(self, db: Session, train_route_id: int, languages: Optional[List[str]] = None) -> Dict:
        """
        Generate audio files for a specific train route using existing text translations
        
        Args:
            db: Database session
            train_route_id: ID of the train route
            languages: List of language codes to generate audio for (defaults to all available)
            
        Returns:
            Dict with generation results
        """
        try:
            # Get the train route
            train_route = db.query(TrainRoute).filter(TrainRoute.id == train_route_id).first()
            if not train_route:
                raise ValueError(f"Train route with ID {train_route_id} not found")
            
            # Get existing translations for this route
            translations_query = db.query(TrainRouteTranslation).filter(
                TrainRouteTranslation.train_route_id == train_route_id
            )
            
            if languages:
                translations_query = translations_query.filter(
                    TrainRouteTranslation.language_code.in_(languages)
                )
            
            translations = translations_query.all()
            
            if not translations:
                raise ValueError(f"No text translations found for train route {train_route_id}")
            
            # Delete existing audio files for this route
            self._delete_existing_audio_files(db, train_route_id)
            
            # Generate audio files
            generated_files = {}
            total_files_generated = 0
            
            for translation in translations:
                lang_code = translation.language_code
                generated_files[lang_code] = {}
                
                # Create directory for this train and language
                train_dir = os.path.join(self.audio_base_path, f"train_{train_route_id}", lang_code)
                os.makedirs(train_dir, exist_ok=True)
                
                # Generate audio for each audio type
                for audio_type in self.audio_types:
                    text_content = getattr(translation, audio_type)
                    if text_content:
                        # Create filename
                        filename = f"{audio_type}.mp3"
                        file_path = os.path.join(train_dir, filename)
                        
                        # Generate audio
                        success = gcp_tts_client.generate_audio(
                            text=text_content,
                            language_code=lang_code,
                            output_path=file_path
                        )
                        
                        if success:
                            # Save to database
                            audio_file = AudioFile(
                                train_route_id=train_route_id,
                                language_code=lang_code,
                                audio_type=audio_type,
                                audio_file_path=file_path
                            )
                            db.add(audio_file)
                            generated_files[lang_code][audio_type] = file_path
                            total_files_generated += 1
                        else:
                            print(f"⚠️ Failed to generate audio for {audio_type} in {lang_code}")
            
            # Commit all changes
            db.commit()
            
            return {
                "success": True,
                "train_route_id": train_route_id,
                "translations_processed": len(translations),
                "audio_files_generated": total_files_generated,
                "languages": list(generated_files.keys()),
                "audio_types": self.audio_types,
                "generated_files": generated_files
            }
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error generating audio for train route {train_route_id}: {str(e)}")

    def generate_audio_for_all_routes(self, db: Session, languages: Optional[List[str]] = None, overwrite_existing: bool = False) -> Dict:
        """
        Generate audio files for all train routes that have text translations
        
        Args:
            db: Database session
            languages: List of language codes to generate audio for
            overwrite_existing: Whether to overwrite existing audio files
            
        Returns:
            Dict with bulk generation results
        """
        try:
            # Get all train routes that have translations
            routes_with_translations = db.query(TrainRouteTranslation.train_route_id).distinct().all()
            route_ids = [route[0] for route in routes_with_translations]
            
            if not route_ids:
                return {
                    "success": True,
                    "message": "No train routes with translations found",
                    "total_routes_processed": 0,
                    "total_files_generated": 0
                }
            
            total_files_generated = 0
            failed_routes = []
            summary = {}
            
            for route_id in route_ids:
                try:
                    if not overwrite_existing:
                        # Check if audio files already exist
                        existing_audio = db.query(AudioFile).filter(
                            AudioFile.train_route_id == route_id
                        ).first()
                        
                        if existing_audio:
                            print(f"⚠️ Audio files already exist for train route {route_id}, skipping...")
                            continue
                    
                    result = self.generate_audio_for_route(db, route_id, languages)
                    total_files_generated += result["audio_files_generated"]
                    
                    # Update summary
                    for lang in result["languages"]:
                        if lang not in summary:
                            summary[lang] = 0
                        summary[lang] += len(result["generated_files"][lang])
                        
                except Exception as e:
                    failed_routes.append({"route_id": route_id, "error": str(e)})
                    print(f"❌ Failed to generate audio for train route {route_id}: {str(e)}")
            
            return {
                "success": True,
                "total_routes_processed": len(route_ids),
                "total_files_generated": total_files_generated,
                "failed_routes": failed_routes,
                "summary": summary
            }
            
        except Exception as e:
            raise Exception(f"Error in bulk audio generation: {str(e)}")

    def get_audio_files_for_route(self, db: Session, train_route_id: int) -> List[AudioFile]:
        """Get all audio files for a specific train route"""
        return db.query(AudioFile).filter(AudioFile.train_route_id == train_route_id).all()

    def get_all_audio_files(self, db: Session) -> List[AudioFile]:
        """Get all audio files from the database"""
        return db.query(AudioFile).all()

    def delete_audio_files_for_route(self, db: Session, train_route_id: int) -> int:
        """Delete all audio files for a specific train route"""
        audio_files = db.query(AudioFile).filter(AudioFile.train_route_id == train_route_id).all()
        
        # Delete physical files
        for audio_file in audio_files:
            try:
                if os.path.exists(audio_file.audio_file_path):
                    os.remove(audio_file.audio_file_path)
            except Exception as e:
                print(f"⚠️ Could not delete physical file {audio_file.audio_file_path}: {str(e)}")
        
        # Delete database records
        deleted_count = db.query(AudioFile).filter(AudioFile.train_route_id == train_route_id).delete()
        db.commit()
        
        return deleted_count

    def clear_all_audio_files(self, db: Session) -> int:
        """Delete all audio files from the database and filesystem"""
        audio_files = db.query(AudioFile).all()
        
        # Delete physical files
        for audio_file in audio_files:
            try:
                if os.path.exists(audio_file.audio_file_path):
                    os.remove(audio_file.audio_file_path)
            except Exception as e:
                print(f"⚠️ Could not delete physical file {audio_file.audio_file_path}: {str(e)}")
        
        # Delete all database records
        deleted_count = db.query(AudioFile).delete()
        db.commit()
        
        return deleted_count

    def _delete_existing_audio_files(self, db: Session, train_route_id: int):
        """Delete existing audio files for a train route"""
        audio_files = db.query(AudioFile).filter(AudioFile.train_route_id == train_route_id).all()
        
        # Delete physical files
        for audio_file in audio_files:
            try:
                if os.path.exists(audio_file.audio_file_path):
                    os.remove(audio_file.audio_file_path)
            except Exception as e:
                print(f"⚠️ Could not delete physical file {audio_file.audio_file_path}: {str(e)}")
        
        # Delete database records
        db.query(AudioFile).filter(AudioFile.train_route_id == train_route_id).delete()

# Global instance
audio_service = AudioService() 