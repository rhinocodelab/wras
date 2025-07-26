# Translation System Documentation

## Overview
The translation system provides multilingual support for train routes using Google Cloud Translation API. It translates train names, station names, and converts train numbers to word representations in four languages: English, Hindi, Marathi, and Gujarati.

## Features

### 1. Train Number Word Conversion
- Converts 5-digit train numbers to word representations
- Example: `12345` → `"one two three four five"`
- Supports all four languages with proper translation

### 2. Multilingual Translation
- Translates train names and station names
- Supports English (en), Hindi (hi), Marathi (mr), Gujarati (gu)
- Uses GCP Translation API for accurate translations

### 3. Database Storage
- Stores translations in `train_route_translations` table
- Links translations to original train routes
- Maintains data integrity with foreign key relationships

## API Endpoints

### 1. Translate and Save Route
```http
POST /api/v1/translate/save/
```
**Request:**
```json
{
  "train_route_id": 1,
  "source_language": "en"
}
```
**Response:**
```json
{
  "train_route_id": 1,
  "translations_saved": true,
  "translations": {
    "en": {
      "train_number": "12345",
      "train_number_words": "one two three four five",
      "train_name": "Rajdhani Express",
      "start_station_name": "New Delhi",
      "end_station_name": "Mumbai Central"
    },
    "hi": {
      "train_number": "12345",
      "train_number_words": "एक दो तीन चार पांच",
      "train_name": "राजधानी एक्सप्रेस",
      "start_station_name": "नई दिल्ली",
      "end_station_name": "मुंबई सेंट्रल"
    }
  }
}
```

### 2. Get Route Translations
```http
GET /api/v1/translate/{train_route_id}
```

### 3. Bulk Translate All Routes
```http
POST /api/v1/translate/bulk/
```

### 4. Simple Text Translation
```http
POST /api/v1/translate/simple/
```
**Request:**
```json
{
  "text": "Welcome to the railway station",
  "source_language": "en"
}
```

## Database Schema

### train_route_translations Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Unique ID |
| train_route_id | INTEGER FK | Foreign key to train_routes.id |
| language_code | TEXT | Language identifier (en, hi, mr, gu) |
| train_number | TEXT | Original 5-digit train number |
| train_number_words | TEXT | Word representation in language |
| train_name | TEXT | Train name in language |
| start_station_name | TEXT | Start station name in language |
| end_station_name | TEXT | End station name in language |

## Setup Instructions

### 1. Install Dependencies
```bash
pip install google-cloud-translate==3.11.1
```

### 2. Configure GCP Credentials
- Place your GCP service account JSON file at `backend/config/isl.json`
- Ensure the service account has Translation API access

### 3. Create Database Table
```bash
cd backend
python create_translation_table.py
```

### 4. Test the System
```bash
python test_translation.py
```

## Usage Examples

### Python Usage
```python
from app.services.translation_service import translate_train_route
from app.core.database import SessionLocal

db = SessionLocal()
try:
    # Translate a specific route
    translations = translate_train_route(db, train_route_id=1, source_lang="en")
    print(translations)
finally:
    db.close()
```

### Frontend Integration
```javascript
// Translate a route
const translateRoute = async (routeId) => {
  const response = await fetch('/api/v1/translate/save/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ train_route_id: routeId })
  });
  return await response.json();
};

// Get translations
const getTranslations = async (routeId) => {
  const response = await fetch(`/api/v1/translate/${routeId}`);
  return await response.json();
};
```

## Error Handling

### Common Errors
1. **GCP Credentials Error**: Check `config/isl.json` file
2. **Route Not Found**: Verify train_route_id exists
3. **Translation API Error**: Check GCP service account permissions
4. **Database Error**: Verify database connection and table structure

### Error Responses
```json
{
  "detail": "Translation failed: GCP credentials error"
}
```

## Performance Considerations

1. **Rate Limiting**: GCP Translation API has rate limits
2. **Batch Processing**: Use bulk translation for multiple routes
3. **Caching**: Consider caching frequently accessed translations
4. **Error Recovery**: Implement retry logic for failed translations

## Security

1. **Input Validation**: All inputs are validated
2. **Error Sanitization**: Error messages don't expose sensitive data
3. **Database Transactions**: Ensures data consistency
4. **Credential Security**: GCP credentials stored securely

## Future Enhancements

1. **Additional Languages**: Easy to add more languages
2. **Audio Integration**: Word representations ready for TTS
3. **Caching Layer**: Redis caching for performance
4. **Async Processing**: Background job processing for bulk operations
5. **Translation Memory**: Store and reuse common translations

## Testing

Run the test script to verify functionality:
```bash
python test_translation.py
```

This will test:
- Number to word conversion
- GCP client initialization
- Translation service integration
- Database operations 