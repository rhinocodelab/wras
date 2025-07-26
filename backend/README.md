# WRAS-DHH Backend

FastAPI backend for the Western Railway Announcement System for Deaf and Hard of Hearing.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the development server:
```bash
uvicorn app.main:app --reload --port 5001
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   └── endpoints/
│   ├── core/
│   │   ├── config/
│   │   └── security/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── utils/
├── tests/
├── requirements.txt
└── README.md
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:5001/docs
- ReDoc: http://localhost:5001/redoc 