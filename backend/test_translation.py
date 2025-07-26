#!/usr/bin/env python3
"""
Test script for translation functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.translation_service import convert_to_english_words, convert_number_to_words
from app.utils.gcp_client import gcp_client

def test_number_to_words():
    """Test number to words conversion"""
    print("Testing number to words conversion...")
    
    test_numbers = ["12345", "98765", "00001"]
    
    for number in test_numbers:
        try:
            english_words = convert_to_english_words(number)
            print(f"Train number {number} → {english_words}")
        except Exception as e:
            print(f"Error converting {number}: {e}")

def test_gcp_client():
    """Test GCP client initialization"""
    print("\nTesting GCP client...")
    
    try:
        # Test simple translation
        result = gcp_client.translate_text("Hello", "en", "hi")
        print(f"English 'Hello' → Hindi: {result}")
        
        # Test language detection
        detected = gcp_client.detect_language("Hello world")
        print(f"Detected language for 'Hello world': {detected}")
        
    except Exception as e:
        print(f"GCP client test failed: {e}")

def test_translation_service():
    """Test translation service with database"""
    print("\nTesting translation service...")
    
    db = SessionLocal()
    try:
        # Test with a sample train route (assuming route ID 1 exists)
        try:
            from app.services.translation_service import translate_train_route
            translations = translate_train_route(db, 1, "en")
            print("Translation service test successful!")
            print(f"Generated translations for {len(translations)} languages")
        except Exception as e:
            print(f"Translation service test failed: {e}")
            
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Translation System Test ===\n")
    
    test_number_to_words()
    test_gcp_client()
    test_translation_service()
    
    print("\n=== Test Complete ===") 