from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import health, auth, projects, tasks

app = FastAPI(
    title="Visual PBL AI Service",
    description="AI service for Visual PBL Platform",
    version="0.1.0"
)

# CORS configuration - validated origins only, never allow wildcard with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1", tags=["authentication"])
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])
app.include_router(tasks.router, prefix="/api/v1", tags=["tasks"])

@app.get("/")
async def root():
    return {"message": "Visual PBL AI Service", "version": "0.1.0"}
