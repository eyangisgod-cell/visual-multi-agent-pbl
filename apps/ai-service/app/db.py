"""
Database connection module using asyncpg

This module provides database connection functions for FastAPI.
"""
import asyncpg
from typing import Optional

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    """
    Get the database connection pool.

    Returns:
        asyncpg.Pool: The connection pool

    Raises:
        RuntimeError: If pool has not been initialized
    """
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_pool() first.")
    return _pool


async def init_pool(database_url: str) -> asyncpg.Pool:
    """
    Initialize the database connection pool.

    Args:
        database_url: PostgreSQL connection URL

    Returns:
        asyncpg.Pool: The initialized connection pool
    """
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(database_url)
        print("Database pool initialized successfully")
    return _pool


async def close_pool() -> None:
    """
    Close the database connection pool.
    """
    global _pool
    if _pool is not None:
        await _pool.close()
        print("Database pool closed")
        _pool = None


# Global database instance for dependency injection
db_pool = None


async def init_db(database_url: str) -> None:
    """Initialize global database pool."""
    global db_pool
    db_pool = await asyncpg.create_pool(database_url)
    print("Database initialized")


async def close_db() -> None:
    """Close global database pool."""
    global db_pool
    if db_pool:
        await db_pool.close()
        print("Database closed")


def get_db_pool() -> asyncpg.Pool:
    """Get the global database pool (synchronous)."""
    if db_pool is None:
        raise RuntimeError("Database not initialized")
    return db_pool
