import os
import json
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.announcement_audio_segment import AnnouncementAudioSegment
from app.models.announcement_category import AnnouncementCategory
from app.utils.gcp_tts_client import GCPTTSClient
from app.core.config.settings import settings

class AudioSegmentService:
    def __init__(self):
        self.tts_client = GCPTTSClient()
        self.base_audio_path = "/var/www/war-ddh/ai-audio-translations/announcements"
        
        # Define segments for each category
        self.category_segments = {
            'arriving': {
                'prefix': 'Attention Please! Train number',
                'from': 'from',
                'to': 'to',
                'suffix': 'is arriving at platform number'
            },
            'delay': {
                'prefix': 'Attention Please! Train number',
                'from': 'from',
                'to': 'to',
                'suffix': 'is running late. We apologize for the inconvenience.'
            },
            'cancelled': {
                'prefix': 'Attention Please! Train number',
                'from': 'from',
                'to': 'to',
                'suffix': 'scheduled for today has been cancelled. We apologize for the inconvenience'
            },
            'platform_change': {
                'prefix': 'Attention Please! The platform for train number',
                'from': 'from',
                'to': 'to',
                'suffix': 'has been changed to platform number'
            }
        }
        
        # Language-specific segment texts
        self.segment_translations = {
            'arriving': {
                'en': {
                    'prefix': 'Attention Please! Train number',
                    'from': 'from',
                    'to': 'to',
                    'suffix': 'is arriving at platform number'
                },
                'hi': {
                    'prefix': 'कृपया ध्यान दें! ट्रेन संख्या',
                    'from': 'से',
                    'to': 'के लिए',
                    'suffix': 'पर आ रही है'
                },
                'mr': {
                    'prefix': 'कृपया लक्ष द्या! ट्रेन क्रमांक',
                    'from': 'ते',
                    'to': 'साठी',
                    'suffix': 'वर येत आहे'
                },
                'gu': {
                    'prefix': 'કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર',
                    'from': 'થી',
                    'to': 'માટે',
                    'suffix': 'પર આવી રહી છે'
                }
            },
            'delay': {
                'en': {
                    'prefix': 'Attention Please! Train number',
                    'from': 'from',
                    'to': 'to',
                    'suffix': 'is running late. We apologize for the inconvenience.'
                },
                'hi': {
                    'prefix': 'कृपया ध्यान दें! ट्रेन संख्या',
                    'from': 'से',
                    'to': 'के लिए',
                    'suffix': 'देर से चल रही है। हमें असुविधा के लिए खेद है।'
                },
                'mr': {
                    'prefix': 'कृपया लक्ष द्या! ट्रेन क्रमांक',
                    'from': 'ते',
                    'to': 'साठी',
                    'suffix': 'उशिरा आहे. झालेल्या गैरसोयीबद्दल आम्ही क्षमस्व आहोत.'
                },
                'gu': {
                    'prefix': 'કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર',
                    'from': 'થી',
                    'to': 'માટે',
                    'suffix': 'મોડે ચાલી રહી છે. અગળ થયેલી અસુવિધા માટે ક્ષમા કરશો.'
                }
            },
            'cancelled': {
                'en': {
                    'prefix': 'Attention Please! Train number',
                    'from': 'from',
                    'to': 'to',
                    'suffix': 'scheduled for today has been cancelled. We apologize for the inconvenience'
                },
                'hi': {
                    'prefix': 'कृपया ध्यान दें! आज की ट्रेन संख्या',
                    'from': 'से',
                    'to': 'के लिए',
                    'suffix': 'रद्द कर दी गई है. हमें हुई असुविधा के लिए खेद है।'
                },
                'mr': {
                    'prefix': 'कृपया लक्ष द्या! आजची ट्रेन क्रमांक',
                    'from': 'ते',
                    'to': 'साठी',
                    'suffix': 'रद्द करण्यात आली आहे. झालेल्या गैरसोयीबद्दल आम्ही क्षमस्व आहोत'
                },
                'gu': {
                    'prefix': 'કૃપા કરીને ધ્યાન આપો! આજની ટ્રેન નંબર',
                    'from': 'થી',
                    'to': 'માટે',
                    'suffix': 'રદ કરી દેવામાં આવી છે. અગળ થયેલી અસુવિધા માટે ક્ષમા કરશો'
                }
            },
            'platform_change': {
                'en': {
                    'prefix': 'Attention Please! The platform for train number',
                    'from': 'from',
                    'to': 'to',
                    'suffix': 'has been changed to platform number'
                },
                'hi': {
                    'prefix': 'कृपया ध्यान दें! ट्रेन संख्या',
                    'from': 'से',
                    'to': 'के लिए',
                    'suffix': 'प्लेटफ़ॉर्म बदलकर प्लेटफ़ॉर्म संख्या कर दिया गया है'
                },
                'mr': {
                    'prefix': 'कृपया लक्ष द्या! ट्रेन क्रमांक',
                    'from': 'ते',
                    'to': 'साठी',
                    'suffix': 'चा प्लॅटफॉर्म बदलून प्लॅटफॉर्म क्रमांक करण्यात आला आहे'
                },
                'gu': {
                    'prefix': 'કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર',
                    'from': 'થી',
                    'to': 'માટે',
                    'suffix': 'પ્લેટફોર્મ નંબર બદલીને કરી દેવામાં આવી છે'
                }
            }
        }

    def get_segments_for_category(self, db: Session, category_id: int) -> List[AnnouncementAudioSegment]:
        """Get all audio segments for a specific category"""
        return db.query(AnnouncementAudioSegment).filter(
            AnnouncementAudioSegment.category_id == category_id
        ).all()

    def get_segments_by_language(self, db: Session, category_id: int, language_code: str) -> List[AnnouncementAudioSegment]:
        """Get audio segments for a specific category and language"""
        return db.query(AnnouncementAudioSegment).filter(
            AnnouncementAudioSegment.category_id == category_id,
            AnnouncementAudioSegment.language_code == language_code
        ).all()

    def get_all_segments(self, db: Session) -> List[AnnouncementAudioSegment]:
        """Get all audio segments across all categories"""
        return db.query(AnnouncementAudioSegment).order_by(
            AnnouncementAudioSegment.category_id,
            AnnouncementAudioSegment.language_code,
            AnnouncementAudioSegment.segment_name
        ).all()

    def generate_segments_for_category(self, db: Session, category_id: int, languages: List[str], overwrite_existing: bool = False) -> Dict:
        """Generate audio segments for a specific category"""
        import time
        
        category = db.query(AnnouncementCategory).filter(AnnouncementCategory.id == category_id).first()
        if not category:
            raise ValueError(f"Category with ID {category_id} not found")

        category_code = category.category_code
        print(f"🎵 Generating audio segments for category: {category_code}")
        generated_segments = []
        failed_segments = []

        # Create directory structure
        for language in languages:
            category_dir = os.path.join(self.base_audio_path, category_code, language)
            os.makedirs(category_dir, exist_ok=True)

        # Generate segments for each language
        for language in languages:
            print(f"🌐 Processing language: {language}")
            if category_code not in self.segment_translations or language not in self.segment_translations[category_code]:
                print(f"⚠️ No translations found for {category_code}/{language}")
                continue

            language_segments = self.segment_translations[category_code][language]
            
            for segment_name, segment_text in language_segments.items():
                try:
                    print(f"🎤 Generating {segment_name} for {category_code}/{language}")
                    
                    # Check if segment already exists
                    existing_segment = db.query(AnnouncementAudioSegment).filter(
                        AnnouncementAudioSegment.category_id == category_id,
                        AnnouncementAudioSegment.segment_name == segment_name,
                        AnnouncementAudioSegment.language_code == language
                    ).first()

                    if existing_segment and not overwrite_existing:
                        print(f"⏭️ Skipping existing segment: {category_code}/{language}/{segment_name}")
                        continue

                    # Generate audio file path
                    audio_filename = f"{segment_name}.mp3"
                    audio_file_path = os.path.join(category_dir, audio_filename)
                    relative_path = f"/announcements/{category_code}/{language}/{audio_filename}"

                    # Generate audio using TTS
                    audio_duration = self.tts_client.generate_audio(
                        text=segment_text,
                        language_code=language,
                        output_path=audio_file_path
                    )
                    print(f"✅ Audio generated: {audio_file_path}")

                    # Save to database
                    if existing_segment:
                        existing_segment.audio_file_path = relative_path
                        existing_segment.audio_duration = audio_duration
                        existing_segment.segment_text = segment_text
                        db.commit()
                        generated_segments.append(existing_segment)
                    else:
                        new_segment = AnnouncementAudioSegment(
                            category_id=category_id,
                            segment_name=segment_name,
                            segment_text=segment_text,
                            language_code=language,
                            audio_file_path=relative_path,
                            audio_duration=audio_duration
                        )
                        db.add(new_segment)
                        db.commit()
                        db.refresh(new_segment)
                        generated_segments.append(new_segment)

                    # Add a small delay to prevent rate limiting
                    time.sleep(0.5)

                except Exception as e:
                    error_msg = f"{category_code}_{language}_{segment_name}: {str(e)}"
                    failed_segments.append(error_msg)
                    print(f"❌ Error generating {category_code}/{language}/{segment_name}: {str(e)}")

        print(f"🎯 Category {category_code} completed: {len(generated_segments)} generated, {len(failed_segments)} failed")
        return {
            "generated_segments": generated_segments,
            "failed_segments": failed_segments,
            "total_generated": len(generated_segments)
        }

    def generate_segments_for_all_categories(self, db: Session, languages: List[str], overwrite_existing: bool = False) -> Dict:
        """Generate audio segments for all categories"""
        categories = db.query(AnnouncementCategory).all()
        all_generated_segments = []
        all_failed_segments = []
        categories_processed = []
        failed_categories = []

        for category in categories:
            try:
                result = self.generate_segments_for_category(
                    db, category.id, languages, overwrite_existing
                )
                all_generated_segments.extend(result["generated_segments"])
                all_failed_segments.extend(result["failed_segments"])
                categories_processed.append(category.category_code)
            except Exception as e:
                failed_categories.append(f"{category.category_code}: {str(e)}")

        return {
            "generated_segments": all_generated_segments,
            "failed_segments": all_failed_segments,
            "categories_processed": categories_processed,
            "failed_categories": failed_categories,
            "total_generated": len(all_generated_segments)
        }

    async def generate_segments_for_all_categories_with_delays(self, db: Session, languages: List[str], overwrite_existing: bool = False, delay_between_requests: int = 2000, delay_between_categories: int = 5000) -> Dict:
        """Generate audio segments for all categories with delays to ensure proper audio quality"""
        try:
            import asyncio
            print("🎵 Starting bulk audio segment generation with delays...")
            print(f"   Delay between requests: {delay_between_requests}ms")
            print(f"   Delay between categories: {delay_between_categories}ms")
            
            categories = db.query(AnnouncementCategory).all()
            total_generated = 0
            categories_processed = []
            failed_categories = []
            
            for i, category in enumerate(categories):
                try:
                    print(f"\n🔄 Processing category {i+1}/{len(categories)}: {category.category_code}")
                    
                    # Generate segments for this category with delays
                    result = await self.generate_segments_for_category_with_delays(
                        db=db,
                        category_id=category.id,
                        languages=languages,
                        overwrite_existing=overwrite_existing,
                        delay_between_requests=delay_between_requests
                    )
                    
                    total_generated += result['total_generated']
                    categories_processed.append(category.category_code)
                    print(f"✅ Completed category: {category.category_code}")
                    
                    # Add delay between categories (except for the last one)
                    if i < len(categories) - 1:
                        print(f"⏳ Waiting {delay_between_categories/1000}s before next category...")
                        await asyncio.sleep(delay_between_categories / 1000)
                    
                except Exception as e:
                    print(f"❌ Failed to process category {category.category_code}: {str(e)}")
                    failed_categories.append(category.category_code)
            
            print(f"\n🎉 Bulk generation with delays completed!")
            print(f"   Total generated: {total_generated}")
            print(f"   Categories processed: {len(categories_processed)}")
            print(f"   Failed categories: {len(failed_categories)}")
            
            return {
                'total_generated': total_generated,
                'categories_processed': categories_processed,
                'failed_categories': failed_categories
            }
            
        except Exception as e:
            print(f"❌ Error in bulk generation with delays: {str(e)}")
            return {
                'total_generated': 0,
                'categories_processed': [],
                'failed_categories': []
            }

    async def generate_segments_for_category_with_delays(self, db: Session, category_id: int, languages: List[str], overwrite_existing: bool = False, delay_between_requests: int = 2000) -> Dict:
        """Generate audio segments for a category with delays between requests"""
        try:
            import asyncio
            print(f"🎵 Generating segments for category {category_id} with delays...")
            
            category = db.query(AnnouncementCategory).filter(AnnouncementCategory.id == category_id).first()
            if not category:
                raise ValueError(f"Category {category_id} not found")
            
            total_generated = 0
            generated_segments = []
            failed_segments = []
            
            # Create category directory
            category_dir = os.path.join(self.base_audio_path, category.category_code)
            os.makedirs(category_dir, exist_ok=True)
            
            for language in languages:
                try:
                    print(f"   🔄 Processing language: {language}")
                    
                    # Create language directory
                    language_dir = os.path.join(category_dir, language)
                    os.makedirs(language_dir, exist_ok=True)
                    
                    # Get segments for this category and language
                    if category.category_code not in self.segment_translations or language not in self.segment_translations[category.category_code]:
                        print(f"      ⚠️ No translations found for {category.category_code}/{language}")
                        continue
                    
                    segments = self.segment_translations[category.category_code][language]
                    
                    for segment_name, segment_text in segments.items():
                        try:
                            # Check if file already exists and overwrite is disabled
                            audio_file_path = os.path.join(language, f"{segment_name}.mp3")
                            full_audio_path = os.path.join(category_dir, audio_file_path)
                            
                            if os.path.exists(full_audio_path) and not overwrite_existing:
                                print(f"      ⏭️ Skipping {segment_name} (already exists)")
                                continue
                            
                            print(f"      🎤 Generating audio for: {segment_name}")
                            
                            # Check if segment already exists
                            existing_segment = db.query(AnnouncementAudioSegment).filter(
                                AnnouncementAudioSegment.category_id == category_id,
                                AnnouncementAudioSegment.segment_name == segment_name,
                                AnnouncementAudioSegment.language_code == language
                            ).first()

                            if existing_segment and not overwrite_existing:
                                print(f"      ⏭️ Skipping existing segment: {segment_name}")
                                continue

                            # Generate audio file path
                            audio_filename = f"{segment_name}.mp3"
                            audio_file_path = os.path.join(language_dir, audio_filename)
                            relative_path = f"/announcements/{category.category_code}/{language}/{audio_filename}"

                            # Generate audio using TTS
                            audio_duration = self.tts_client.generate_audio(
                                text=segment_text,
                                language_code=language,
                                output_path=audio_file_path
                            )
                            
                            if audio_duration:
                                # Save to database
                                if existing_segment:
                                    existing_segment.audio_file_path = relative_path
                                    existing_segment.audio_duration = audio_duration
                                    existing_segment.segment_text = segment_text
                                    db.commit()
                                    generated_segments.append(existing_segment)
                                else:
                                    new_segment = AnnouncementAudioSegment(
                                        category_id=category_id,
                                        segment_name=segment_name,
                                        segment_text=segment_text,
                                        language_code=language,
                                        audio_file_path=relative_path,
                                        audio_duration=audio_duration
                                    )
                                    db.add(new_segment)
                                    db.commit()
                                    db.refresh(new_segment)
                                    generated_segments.append(new_segment)
                                
                                total_generated += 1
                                print(f"      ✅ Generated: {segment_name}")
                                
                                # Add delay between requests
                                if delay_between_requests > 0:
                                    await asyncio.sleep(delay_between_requests / 1000)
                                
                            else:
                                failed_segments.append(f"{segment_name} ({language})")
                                print(f"      ❌ Failed to generate: {segment_name}")
                                
                        except Exception as e:
                            failed_segments.append(f"{segment_name} ({language})")
                            print(f"      ❌ Error generating {segment_name}: {str(e)}")
                    
                    print(f"   ✅ Completed language: {language}")
                    
                except Exception as e:
                    print(f"   ❌ Error processing language {language}: {str(e)}")
                    failed_segments.append(f"language_{language}")
            
            print(f"🎉 Category {category.category_code} completed!")
            print(f"   Generated: {total_generated}")
            print(f"   Failed: {len(failed_segments)}")
            
            return {
                'total_generated': total_generated,
                'generated_segments': generated_segments,
                'failed_segments': failed_segments
            }
            
        except Exception as e:
            print(f"❌ Error generating segments for category {category_id}: {str(e)}")
            return {
                'total_generated': 0,
                'generated_segments': [],
                'failed_segments': [str(e)]
            }

    def delete_segments_for_category(self, db: Session, category_id: int) -> bool:
        """Delete all audio segments for a category"""
        segments = self.get_segments_for_category(db, category_id)
        
        for segment in segments:
            # Delete physical file
            full_path = os.path.join(self.base_audio_path, segment.audio_file_path.lstrip('/'))
            if os.path.exists(full_path):
                os.remove(full_path)
            
            # Delete from database
            db.delete(segment)
        
        db.commit()
        return True

    def get_segment_availability(self, db: Session, category_id: int) -> Dict:
        """Get segment availability statistics for a category"""
        segments = self.get_segments_for_category(db, category_id)
        
        availability = {}
        for language in ['en', 'hi', 'mr', 'gu']:
            language_segments = [s for s in segments if s.language_code == language]
            availability[language] = {
                'total_segments': len(language_segments),
                'available_segments': len([s for s in language_segments if s.audio_file_path]),
                'segments': {s.segment_name: s.audio_file_path is not None for s in language_segments}
            }
        
        return availability

    def clear_all_segments(self, db: Session) -> bool:
        """Delete all audio segments from all categories"""
        try:
            print("🗑️ Starting clear all segments operation...")
            
            # Get all segments
            all_segments = db.query(AnnouncementAudioSegment).all()
            print(f"📊 Found {len(all_segments)} segments to delete from database")
            
            # Delete from database first
            for segment in all_segments:
                db.delete(segment)
            
            db.commit()
            print("✅ Database records deleted successfully")
            
            # Delete all physical files in the announcements directory
            announcements_dir = self.base_audio_path
            if os.path.exists(announcements_dir):
                print(f"🗑️ Attempting to delete directory: {announcements_dir}")
                
                # Force delete the entire announcements directory and all its contents
                try:
                    import shutil
                    shutil.rmtree(announcements_dir, ignore_errors=True)
                    print(f"✅ Successfully deleted directory: {announcements_dir}")
                except Exception as e:
                    print(f"❌ Error deleting directory: {e}")
                    # Fallback: try to delete files individually
                    self._delete_files_manually(announcements_dir)
            else:
                print(f"ℹ️ Directory does not exist: {announcements_dir}")
            
            print("✅ Clear all segments operation completed successfully")
            return True
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error clearing all audio segments: {str(e)}")
            return False

    def _delete_files_manually(self, directory_path: str):
        """Manual fallback method to delete files"""
        try:
            for root, dirs, files in os.walk(directory_path, topdown=False):
                # Delete files first
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        os.remove(file_path)
                        print(f"✅ Deleted file: {file_path}")
                    except Exception as e:
                        print(f"❌ Error deleting file {file_path}: {e}")
                
                # Then delete directories
                for dir_name in dirs:
                    dir_path = os.path.join(root, dir_name)
                    try:
                        os.rmdir(dir_path)
                        print(f"✅ Deleted directory: {dir_path}")
                    except Exception as e:
                        print(f"❌ Error deleting directory {dir_path}: {e}")
            
            # Finally try to delete the root directory
            try:
                os.rmdir(directory_path)
                print(f"✅ Deleted root directory: {directory_path}")
            except Exception as e:
                print(f"❌ Error deleting root directory {directory_path}: {e}")
                
        except Exception as e:
            print(f"❌ Error in manual deletion: {e}") 