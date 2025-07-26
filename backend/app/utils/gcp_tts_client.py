import os
import json
from google.cloud import texttospeech
from google.oauth2 import service_account

class GCPTTSClient:
    def __init__(self):
        self.client = None
        self._initialize_client()
        
        # Voice configurations for Chirp 3 HD
        self.voice_configs = {
            'en': {
                'language_code': 'en-IN',
                'name': 'en-IN-Chirp3-HD-Achernar',
                'ssml_gender': texttospeech.SsmlVoiceGender.NEUTRAL
            },
            'hi': {
                'language_code': 'hi-IN',
                'name': 'hi-IN-Chirp3-HD-Achernar',
                'ssml_gender': texttospeech.SsmlVoiceGender.NEUTRAL
            },
            'mr': {
                'language_code': 'mr-IN',
                'name': 'mr-IN-Chirp3-HD-Achernar',
                'ssml_gender': texttospeech.SsmlVoiceGender.NEUTRAL
            },
            'gu': {
                'language_code': 'gu-IN',
                'name': 'gu-IN-Chirp3-HD-Achernar',
                'ssml_gender': texttospeech.SsmlVoiceGender.NEUTRAL
            }
        }

    def _initialize_client(self):
        """Initialize the GCP Text-to-Speech client using isl.json credentials"""
        try:
            # Path to the credentials file
            credentials_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'isl.json')
            
            if not os.path.exists(credentials_path):
                raise FileNotFoundError(f"Credentials file not found at: {credentials_path}")
            
            # Load credentials
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            
            # Initialize the client
            self.client = texttospeech.TextToSpeechClient(credentials=credentials)
            print("✅ GCP Text-to-Speech client initialized successfully")
            
        except Exception as e:
            print(f"❌ Error initializing GCP Text-to-Speech client: {str(e)}")
            raise

    def generate_audio(self, text: str, language_code: str, output_path: str) -> float:
        """
        Generate audio from text using GCP Text-to-Speech
        
        Args:
            text: Text to convert to speech
            language_code: Language code ('en', 'hi', 'mr', 'gu')
            output_path: Path where to save the audio file
            
        Returns:
            float: Audio duration in seconds, or 1.0 as default
        """
        try:
            if not self.client:
                raise Exception("GCP Text-to-Speech client not initialized")
            
            if language_code not in self.voice_configs:
                raise ValueError(f"Unsupported language code: {language_code}")
            
            voice_config = self.voice_configs[language_code]
            
            # Create the synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code=voice_config['language_code'],
                name=voice_config['name'],
                ssml_gender=voice_config['ssml_gender']
            )
            
            # Select the type of audio file to return
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                sample_rate_hertz=24000
            )
            
            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Ensure the output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Write the audio content to the file
            with open(output_path, "wb") as out:
                out.write(response.audio_content)
            
            print(f"✅ Audio generated successfully: {output_path}")
            # Return a default duration of 1.0 seconds
            return 1.0
            
        except Exception as e:
            print(f"❌ Error generating audio for '{text}' in {language_code}: {str(e)}")
            return 1.0

    def get_supported_languages(self) -> dict:
        """Get supported language configurations"""
        return self.voice_configs.copy()

# Global instance
gcp_tts_client = GCPTTSClient() 