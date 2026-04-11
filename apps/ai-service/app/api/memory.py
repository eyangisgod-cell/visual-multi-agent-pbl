"""
Agent Memory API endpoints

Endpoints:
- POST /api/v1/memory - Add memory
- GET /api/v1/memory/{agent_id} - Get memory list
- POST /api/v1/memory/search - Vector search memories
- POST /api/v1/memory/consolidate - Consolidate short-term to long-term memories
- POST /api/v1/memory/calculate-importance - Calculate memory importance
- POST /api/v1/memory/calculate-decay - Calculate memory decay factor
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime, timedelta
import math
import asyncpg
import json

from app.db import get_db_pool

# Lazy import sentence_transformers to avoid long startup time
_embedding_model = None


def get_embedding_model():
    """Get or create the sentence transformer model (lazy loading)."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Using all-MiniLM-L6-v2 which produces 384-dimensional vectors
            # Good balance of performance and accuracy for semantic search
            _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except ImportError:
            raise ImportError(
                "sentence-transformers not installed. "
                "Please install with: pip install sentence-transformers"
            )
    return _embedding_model


def generate_embedding(text: str) -> List[float]:
    """Generate embedding vector for text using sentence-transformers."""
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


router = APIRouter()


class MemoryType(str, Enum):
    SHORT_TERM = "SHORT_TERM"
    LONG_TERM = "LONG_TERM"
    EPISODIC = "EPISODIC"
    PROCEDURAL = "PROCEDURAL"
    SEMANTIC = "SEMANTIC"


class MemoryCreate(BaseModel):
    agent_id: str = Field(..., description="Agent ID")
    type: MemoryType = Field(..., description="Memory type")
    content: str = Field(..., description="Memory content")
    importance: Optional[int] = Field(default=1, ge=1, le=10, description="Importance score 1-10")
    tags: Optional[List[str]] = Field(default_factory=list, description="Memory tags")
    embedding: Optional[List[float]] = Field(default=None, description="Embedding vector")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")


class MemorySearch(BaseModel):
    agent_id: str = Field(..., description="Agent ID")
    query: str = Field(..., description="Search query")
    memory_type: Optional[MemoryType] = Field(default=None, description="Filter by memory type")
    top_k: Optional[int] = Field(default=5, ge=1, le=100, description="Number of results")


class MemoryConsolidate(BaseModel):
    agent_id: str = Field(..., description="Agent ID")
    threshold: Optional[int] = Field(default=5, ge=1, le=10, description="Importance threshold for consolidation")


class MemoryImportanceInput(BaseModel):
    agent_id: str = Field(..., description="Agent ID")
    interactions_count: int = Field(..., ge=0, description="Number of interactions")
    time_weight: float = Field(..., ge=0, le=1, description="Recency weight (0-1)")
    emotional_weight: Optional[float] = Field(default=0.5, ge=0, le=1, description="Emotional weight (0-1)")


class MemoryDecayInput(BaseModel):
    agent_id: str = Field(..., description="Agent ID")
    days_old: int = Field(..., ge=0, description="Age of memory in days")


class MemoryResponse(BaseModel):
    id: str
    agent_id: str
    type: MemoryType
    content: str
    importance: Optional[int]
    tags: Optional[List[str]]
    metadata: Optional[Dict[str, Any]]


def memory_to_response(row: asyncpg.Record) -> MemoryResponse:
    """Convert database row to response model."""
    metadata = row["metadata"]
    # Deserialize JSON string from database if needed
    if isinstance(metadata, str):
        metadata = json.loads(metadata)

    return MemoryResponse(
        id=str(row["id"]),
        agent_id=str(row["agent_id"]),
        type=MemoryType(row["type"]),
        content=row["content"],
        importance=row["importance"],
        tags=row["tags"] or [],
        metadata=metadata,
    )


@router.post("/memory", status_code=201, response_model=MemoryResponse)
async def add_memory(memory: MemoryCreate):
    """
    Add a new memory for an agent.
    Automatically generates embedding vector if not provided.
    """
    pool = get_db_pool()

    # Calculate expiry for short-term memories (24 hours)
    expires_at = None
    if memory.type == MemoryType.SHORT_TERM:
        expires_at = datetime.now() + timedelta(hours=24)

    # Generate embedding if not provided
    embedding = memory.embedding
    if embedding is None:
        try:
            embedding = generate_embedding(memory.content)
        except Exception as e:
            # If embedding generation fails, store without embedding
            # Vector search will fallback to ILIKE for this memory
            embedding = None

    # Create memory in database
    async with pool.acquire() as conn:
        # Serialize metadata to JSON string for asyncpg
        metadata_json = json.dumps(memory.metadata) if memory.metadata else None

        row = await conn.fetchrow(
            """
            INSERT INTO agent_memories
                (agent_id, type, content, importance, tags, embedding, metadata, expires_at, consolidated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, agent_id, type, content, importance, tags, metadata
            """,
            memory.agent_id,
            memory.type.value,
            memory.content,
            memory.importance,
            memory.tags,
            embedding,
            metadata_json,
            expires_at,
            False,
        )

    return memory_to_response(row)


@router.get("/memory/{agent_id}", response_model=List[MemoryResponse])
async def get_memories(
    agent_id: str,
    memory_type: Optional[MemoryType] = Query(None, description="Filter by memory type"),
    limit: Optional[int] = Query(50, ge=1, le=100, description="Max results to return")
):
    """
    Get memories for a specific agent.
    """
    pool = get_db_pool()

    # Build query (get_memories)
    query = """
        SELECT id, agent_id, type, content, importance, tags, metadata
        FROM agent_memories
        WHERE agent_id = $1
    """
    params = [agent_id]

    if memory_type:
        query += " AND type = $2"
        params.append(memory_type.value)

    query += " ORDER BY created_at DESC LIMIT $" + str(len(params) + 1)
    params.append(limit)

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    return [memory_to_response(row) for row in rows]


@router.post("/memory/search", response_model=List[Dict[str, Any]])
async def search_memories(search: MemorySearch):
    """
    Search memories using vector similarity search with pgvector.
    Uses cosine similarity on sentence embeddings for semantic search.

    For memories without embeddings (if embedding generation failed during creation),
    they will still be included in the search using ILIKE fallback.
    """
    pool = get_db_pool()

    try:
        # Generate embedding for the search query
        query_embedding = generate_embedding(search.query)
    except Exception as e:
        # Fallback to ILIKE search if embedding generation fails
        return await _search_memories_fallback(search)

    # Build query with vector similarity search
    # Using cosine distance (<->) which returns 0 for identical vectors, 2 for opposite
    # Convert to similarity: 1 - cosine_distance gives cosine similarity (0 to 1)
    # Only search memories that have embeddings (IS NOT NULL)
    query = """
        SELECT id, agent_id, type, content, importance, tags, metadata,
               1 - (embedding <-> $2::vector) AS similarity
        FROM agent_memories
        WHERE agent_id = $1
          AND embedding IS NOT NULL
    """
    params = [search.agent_id, query_embedding]

    if search.memory_type:
        query += " AND type = $3"
        params.append(search.memory_type.value)

    # Order by similarity (descending) and limit results
    query += " ORDER BY similarity DESC LIMIT $" + str(len(params) + 1)
    params.append(search.top_k)

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    # If no results with vector search, try fallback to ILIKE
    if len(rows) == 0:
        return await _search_memories_fallback(search)

    return [
        {
            "id": str(row["id"]),
            "agent_id": str(row["agent_id"]),
            "type": row["type"],
            "content": row["content"],
            "importance": row["importance"],
            "tags": row["tags"] or [],
            "similarity": float(row["similarity"]),
        }
        for row in rows
    ]


async def _search_memories_fallback(search: MemorySearch) -> List[Dict[str, Any]]:
    """
    Fallback to ILIKE search if vector search is not available.
    """
    pool = get_db_pool()

    # Build query with ILIKE search
    query = """
        SELECT id, agent_id, type, content, importance, tags, metadata,
               1.0 AS rank
        FROM agent_memories
        WHERE agent_id = $1
    """
    params = [search.agent_id]

    if search.memory_type:
        query += " AND type = $2"
        params.append(search.memory_type.value)

    # ILIKE search - split query by spaces and match each term
    param_index = len(params) + 1
    query += f" AND content ILIKE ${param_index}"
    params.append(f"%{search.query}%")

    query += " ORDER BY created_at DESC LIMIT $" + str(len(params) + 1)
    params.append(search.top_k)

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    return [
        {
            "id": str(row["id"]),
            "agent_id": str(row["agent_id"]),
            "type": row["type"],
            "content": row["content"],
            "importance": row["importance"],
            "tags": row["tags"] or [],
            "similarity": 1.0,
        }
        for row in rows
    ]


@router.post("/memory/consolidate", response_model=Dict[str, Any])
async def consolidate_memories(consolidate: MemoryConsolidate):
    """
    Consolidate short-term memories to long-term based on importance threshold.
    """
    pool = get_db_pool()

    async with pool.acquire() as conn:
        # Update memories
        result = await conn.execute(
            """
            UPDATE agent_memories
            SET type = 'LONG_TERM', consolidated = TRUE, expires_at = NULL
            WHERE agent_id = $1
              AND type = 'SHORT_TERM'
              AND consolidated = FALSE
              AND importance >= $2
            """,
            consolidate.agent_id,
            consolidate.threshold,
        )

        # Get count of updated rows
        updated_count = int(result.split()[-1]) if result else 0

    return {
        "consolidated_count": updated_count,
        "memories_consolidated": [],
    }


@router.post("/memory/calculate-importance", response_model=Dict[str, Any])
async def calculate_importance(input: MemoryImportanceInput):
    """
    Calculate importance score for a memory based on multiple factors.
    """
    # Frequency component (0-3 points)
    frequency_score = min(3, input.interactions_count * 0.3)

    # Recency component (0-4 points)
    recency_score = input.time_weight * 4

    # Emotional component (0-3 points)
    emotional_score = input.emotional_weight * 3

    # Total score (1-10)
    importance = max(1, min(10, int(frequency_score + recency_score + emotional_score)))

    return {"importance": importance}


@router.post("/memory/calculate-decay", response_model=Dict[str, Any])
async def calculate_decay(input: MemoryDecayInput):
    """
    Calculate memory decay factor based on age.
    """
    # Exponential decay with ~30 days half-life
    lambda_decay = 0.023
    decay_factor = math.exp(-lambda_decay * input.days_old)

    return {"decay_factor": round(decay_factor, 3)}
