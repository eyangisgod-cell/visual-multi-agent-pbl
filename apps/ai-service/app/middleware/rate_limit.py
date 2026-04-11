"""
Rate Limiting Middleware using Redis

Implements token bucket algorithm for rate limiting based on IP address.
Configuration: 100 requests per minute per IP.
"""

import time
from typing import Optional
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using Redis.

    Limits requests based on IP address using a sliding window counter.
    Default: 100 requests per minute per IP.
    """

    def __init__(
        self,
        app,
        redis_url: str = "redis://localhost:6379",
        requests_per_minute: int = 100,
        window_seconds: int = 60,
        excluded_paths: Optional[list] = None
    ):
        super().__init__(app)
        self.redis_url = redis_url
        self.requests_per_minute = requests_per_minute
        self.window_seconds = window_seconds
        self.excluded_paths = excluded_paths or ["/api/v1/health", "/health", "/"]
        self._redis: Optional[redis.Redis] = None

    async def _get_redis(self) -> redis.Redis:
        """Get or create Redis connection."""
        if self._redis is None:
            self._redis = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self._redis

    async def _is_rate_limited(self, ip: str) -> bool:
        """
        Check if IP is rate limited using sliding window counter.

        Args:
            ip: Client IP address

        Returns:
            True if rate limited, False otherwise
        """
        redis_client = await self._get_redis()
        key = f"ratelimit:{ip}"
        now = time.time()
        window_start = now - self.window_seconds

        async with redis_client.pipeline() as pipe:
            # Remove old entries outside the window
            await pipe.zremrangebyscore(key, 0, window_start)
            # Add current request
            await pipe.zadd(key, {str(now): now})
            # Set expiry on the key
            await pipe.expire(key, self.window_seconds * 2)
            # Count requests in window
            await pipe.zcard(key)
            results = await pipe.execute()

        request_count = results[-1]
        return request_count > self.requests_per_minute

    async def _get_remaining_requests(self, ip: str) -> int:
        """Get remaining requests for an IP."""
        redis_client = await self._get_redis()
        key = f"ratelimit:{ip}"
        now = time.time()
        window_start = now - self.window_seconds

        count = await redis_client.zcount(key, window_start, now)
        return max(0, self.requests_per_minute - count)

    async def dispatch(self, request: Request, call_next):
        """Process the request with rate limiting."""
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.excluded_paths):
            return await call_next(request)

        # Get client IP (handle X-Forwarded-For header)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        # Check rate limit
        try:
            is_limited = await self._is_rate_limited(client_ip)
            remaining = await self._get_remaining_requests(client_ip)
        except redis.RedisError:
            # If Redis is unavailable, allow request but log warning
            print(f"Warning: Redis unavailable, skipping rate limit for {client_ip}")
            return await call_next(request)
        except Exception as e:
            print(f"Rate limit error: {e}")
            return await call_next(request)

        if is_limited:
            # Return 429 Too Many Requests
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Maximum {self.requests_per_minute} requests per {self.window_seconds} seconds",
                    "retry_after": self.window_seconds
                },
                headers={
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + self.window_seconds),
                    "Retry-After": str(self.window_seconds)
                }
            )

        # Process request and add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + self.window_seconds)

        return response


def create_rate_limit_middleware(
    redis_url: str = None,
    requests_per_minute: int = 100,
    excluded_paths: Optional[list] = None
) -> RateLimitMiddleware:
    """
    Factory function to create rate limit middleware.

    Args:
        redis_url: Redis connection URL
        requests_per_minute: Maximum requests per minute
        excluded_paths: Paths to exclude from rate limiting

    Returns:
        RateLimitMiddleware instance
    """
    from app.config import settings

    if redis_url is None:
        redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379')

    return RateLimitMiddleware(
        app=None,  # Will be set by FastAPI
        redis_url=redis_url,
        requests_per_minute=requests_per_minute,
        excluded_paths=excluded_paths
    )
