from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api import health, auth
from app.api.agents import router as agents_router
from app.api import projects, tasks, memory
from app.api import websocket
from app.db import init_db, close_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security import SecurityMiddleware
from app.middleware.csrf import CSRFMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for FastAPI application.
    Handles database connection on startup and cleanup on shutdown.
    """
    # Startup: Connect to database
    await init_db(settings.DATABASE_URL)
    yield
    # Shutdown: Disconnect from database
    await close_db()


app = FastAPI(
    title="Visual PBL AI Service",
    description="AI service for Visual PBL Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration - validated origins only, never allow wildcard with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Middleware (SQL Injection, XSS protection, Security Headers)
# Note: Must be added first to process requests before other middleware
app.add_middleware(
    SecurityMiddleware,
    enabled_checks={'sql_injection', 'xss', 'headers'},
    max_input_length=10000,
    excluded_paths=['/api/v1/health', '/health', '/']
)

# CSRF Protection Middleware (before rate limiting)
app.add_middleware(
    CSRFMiddleware,
    cookie_name='csrf-token',
    header_name='x-csrf-token',
    excluded_paths=['/api/v1/health', '/health', '/', '/api/v1/auth/verify'],
    safe_methods=['GET', 'HEAD', 'OPTIONS']
)

# Rate Limiting Middleware (100 requests/minute/IP using Redis)
# Added last so it processes outermost
app.add_middleware(
    RateLimitMiddleware,
    redis_url=getattr(settings, 'REDIS_URL', 'redis://localhost:6379'),
    requests_per_minute=100,
    window_seconds=60,
    excluded_paths=['/api/v1/health', '/health', '/']
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1", tags=["authentication"])
app.include_router(agents_router, prefix="/api/v1", tags=["agents"])
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])
app.include_router(tasks.router, prefix="/api/v1", tags=["tasks"])
app.include_router(memory.router, prefix="/api/v1", tags=["memory"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

@app.get("/")
async def root():
    return {"message": "Visual PBL AI Service", "version": "0.1.0"}
