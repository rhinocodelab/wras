from fastapi import APIRouter
from app.api.endpoints import auth, train_routes, translation, audio, announcements, audio_segments, isl_videos

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(train_routes.router, prefix="/train-routes", tags=["train routes"])
api_router.include_router(translation.router, prefix="/translate", tags=["translation"])
api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["announcements"])
api_router.include_router(audio_segments.router, prefix="/audio-segments", tags=["audio segments"])
api_router.include_router(isl_videos.router, prefix="/isl-videos", tags=["isl videos"]) 