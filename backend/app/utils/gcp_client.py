import os
import json
from google.cloud import translate_v2 as translate
from google.oauth2 import service_account

class GCPTranslationClient:
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize GCP Translation client with credentials from isl.json"""
        try:
            # Path to the credentials file
            credentials_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                "config", 
                "isl.json"
            )
            
            if not os.path.exists(credentials_path):
                raise FileNotFoundError(f"GCP credentials file not found at: {credentials_path}")
            
            # Load credentials from file
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            
            # Initialize translation client
            self.client = translate.Client(credentials=credentials)
            
        except Exception as e:
            raise Exception(f"Failed to initialize GCP Translation client: {str(e)}")
    
    def translate_text(self, text: str, source_language: str, target_language: str) -> str:
        """
        Translate text from source language to target language
        
        Args:
            text: Text to translate
            source_language: Source language code (e.g., 'en')
            target_language: Target language code (e.g., 'hi')
        
        Returns:
            Translated text
        """
        try:
            if not self.client:
                raise Exception("GCP Translation client not initialized")
            
            # Perform translation
            result = self.client.translate(
                text, 
                source_language=source_language, 
                target_language=target_language
            )
            
            return result['translatedText']
            
        except Exception as e:
            raise Exception(f"Translation failed: {str(e)}")
    
    def detect_language(self, text: str) -> str:
        """
        Detect the language of the given text
        
        Args:
            text: Text to detect language for
        
        Returns:
            Detected language code
        """
        try:
            if not self.client:
                raise Exception("GCP Translation client not initialized")
            
            # Detect language
            result = self.client.detect_language(text)
            
            return result['language']
            
        except Exception as e:
            raise Exception(f"Language detection failed: {str(e)}")

# Global instance
gcp_client = GCPTranslationClient() 