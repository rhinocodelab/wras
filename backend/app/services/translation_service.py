from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from app.models.train_route import TrainRoute
from app.models.train_route_translation import TrainRouteTranslation
from app.services.train_route_service import get_train_route
from app.utils.gcp_client import gcp_client

def convert_to_english_words(number: str) -> str:
    """
    Convert 5-digit number to English words
    
    Args:
        number: 5-digit train number as string
    
    Returns:
        English word representation (e.g., "one two three four five")
    """
    digit_words = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
    }
    
    # Validate input
    if not number or len(number) != 5 or not number.isdigit():
        raise ValueError("Train number must be exactly 5 digits")
    
    # Convert each digit to word
    words = [digit_words[digit] for digit in number]
    return " ".join(words)

def convert_number_to_words(number: str, language: str) -> str:
    """
    Convert 5-digit train number to words in specified language
    
    Args:
        number: 5-digit train number
        language: Target language code
    
    Returns:
        Word representation in target language
    """
    if language == "en":
        return convert_to_english_words(number)
    else:
        # Convert to English words first, then translate
        english_words = convert_to_english_words(number)
        return gcp_client.translate_text(english_words, "en", language)

def delete_existing_translations(db: Session, train_route_id: int) -> None:
    """
    Delete existing translations for a train route
    
    Args:
        db: Database session
        train_route_id: ID of the train route
    """
    db.query(TrainRouteTranslation).filter(
        TrainRouteTranslation.train_route_id == train_route_id
    ).delete()
    db.commit()

def save_translations(db: Session, train_route_id: int, translations: Dict) -> None:
    """
    Save translations to database
    
    Args:
        db: Database session
        train_route_id: ID of the train route
        translations: Dictionary of translations by language
    """
    for language_code, translation_data in translations.items():
        db_translation = TrainRouteTranslation(
            train_route_id=train_route_id,
            language_code=language_code,
            train_number=translation_data['train_number'],
            train_number_words=translation_data['train_number_words'],
            train_name=translation_data['train_name'],
            start_station_name=translation_data['start_station_name'],
            end_station_name=translation_data['end_station_name']
        )
        db.add(db_translation)
    
    db.commit()

def translate_train_route(db: Session, train_route_id: int, source_lang: str = "en") -> Dict:
    """
    Translate a train route to all supported languages
    
    Args:
        db: Database session
        train_route_id: ID of the train route to translate
        source_lang: Source language code (default: "en")
    
    Returns:
        Dictionary containing translations for all languages
    """
    # Get the original train route
    route = get_train_route(db, train_route_id)
    if not route:
        raise ValueError(f"Train route with ID {train_route_id} not found")
    
    # Delete existing translations
    delete_existing_translations(db, train_route_id)
    
    # Define target languages
    target_languages = ['en', 'hi', 'mr', 'gu']
    translations = {}
    
    for lang in target_languages:
        if lang == source_lang:
            # Use original text for source language
            translations[lang] = {
                'train_number': route.train_number,
                'train_number_words': convert_to_english_words(route.train_number),
                'train_name': route.train_name_en,
                'start_station_name': route.start_station_en,
                'end_station_name': route.end_station_en
            }
        else:
            # Translate to target language
            translations[lang] = {
                'train_number': route.train_number,
                'train_number_words': convert_number_to_words(route.train_number, lang),
                'train_name': gcp_client.translate_text(route.train_name_en, source_lang, lang),
                'start_station_name': gcp_client.translate_text(route.start_station_en, source_lang, lang),
                'end_station_name': gcp_client.translate_text(route.end_station_en, source_lang, lang)
            }
    
    # Save translations to database
    save_translations(db, train_route_id, translations)
    
    return translations

def get_train_route_translations(db: Session, train_route_id: int) -> Optional[Dict]:
    """
    Get translations for a specific train route
    
    Args:
        db: Database session
        train_route_id: ID of the train route
    
    Returns:
        Dictionary of translations by language, or None if not found
    """
    translations = db.query(TrainRouteTranslation).filter(
        TrainRouteTranslation.train_route_id == train_route_id
    ).all()
    
    if not translations:
        return None
    
    result = {}
    for translation in translations:
        result[translation.language_code] = {
            'train_number': translation.train_number,
            'train_number_words': translation.train_number_words,
            'train_name': translation.train_name,
            'start_station_name': translation.start_station_name,
            'end_station_name': translation.end_station_name
        }
    
    return result

def bulk_translate_all_routes(db: Session, source_lang: str = "en") -> Dict:
    """
    Translate all train routes to all supported languages
    
    Args:
        db: Database session
        source_lang: Source language code (default: "en")
    
    Returns:
        Dictionary with translation statistics
    """
    # Get all train routes
    routes = db.query(TrainRoute).all()
    total_routes = len(routes)
    translated_routes = 0
    failed_routes = 0
    
    for route in routes:
        try:
            translate_train_route(db, route.id, source_lang)
            translated_routes += 1
        except Exception as e:
            print(f"Failed to translate route {route.id}: {str(e)}")
            failed_routes += 1
    
    return {
        "total_routes": total_routes,
        "translated_routes": translated_routes,
        "failed_routes": failed_routes,
        "message": f"Successfully translated {translated_routes} out of {total_routes} routes"
    } 