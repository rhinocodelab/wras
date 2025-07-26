from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.core.config.settings import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio
try:
    app.mount("/ai-audio-translations", StaticFiles(directory="/var/www/war-ddh/ai-audio-translations"), name="audio-files")
except Exception as e:
    print(f"Warning: Could not mount audio files directory: {e}")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "WRAS-DHH Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 