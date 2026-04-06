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
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime, timedelta
import math
import json

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


@router.post("/memory", status_code=201, response_model=MemoryResponse)
async def add_memory(memory: MemoryCreate):
    """
    Add a new memory for an agent.

    - **agent_id**: The ID of the agent
    - **type**: Type of memory (SHORT_TERM, LONG_TERM, EPISODIC, PROCEDURAL, SEMANTIC)
    - **content**: The memory content
    - **importance**: Importance score from 1-10
    - **tags**: List of tags for categorization
    - **embedding**: Optional embedding vector for semantic search
    - **metadata**: Optional additional metadata
    """
    # TODO: Implement database storage
    # For now, return a mock response
    return {
        "id": "mock-memory-id",
        "agent_id": memory.agent_id,
        "type": memory.type,
        "content": memory.content,
        "importance": memory.importance,
        "tags": memory.tags,
        "metadata": memory.metadata
    }


@router.get("/memory/{agent_id}", response_model=List[MemoryResponse])
async def get_memories(
    agent_id: str,
    memory_type: Optional[MemoryType] = Query(None, description="Filter by memory type"),
    limit: Optional[int] = Query(50, ge=1, le=100, description="Max results to return")
):
    """
    Get memories for a specific agent.

    - **agent_id**: The ID of the agent
    - **memory_type**: Optional filter by memory type
    - **limit**: Maximum number of results (default: 50)
    """
    # TODO: Implement database query
    # For now, return an empty list
    return []


@router.post("/memory/search", response_model=List[Dict[str, Any]])
async def search_memories(search: MemorySearch):
    """
    Search memories using vector similarity.

    - **agent_id**: The ID of the agent
    - **query**: The search query text
    - **memory_type**: Optional filter by memory type
    - **top_k**: Number of results to return (default: 5)

    Returns memories ranked by similarity to the query.
    """
    # TODO: Implement vector search using embeddings
    # For now, return an empty list
    return []


@router.post("/memory/consolidate", response_model=Dict[str, Any])
async def consolidate_memories(consolidate: MemoryConsolidate):
    """
    Consolidate short-term memories to long-term based on importance threshold.

    - **agent_id**: The ID of the agent
    - **threshold**: Minimum importance score for consolidation (default: 5)

    Returns the count and list of consolidated memories.
    """
    # TODO: Implement database query and update
    # For now, return a mock response
    return {
        "consolidated_count": 0,
        "memories_consolidated": []
    }


@router.post("/memory/calculate-importance", response_model=Dict[str, Any])
async def calculate_importance(input: MemoryImportanceInput):
    """
    Calculate importance score for a memory based on multiple factors.

    Factors:
    - **interactions_count**: How often the memory was accessed
    - **time_weight**: Recency of the memory (0-1)
    - **emotional_weight**: Emotional significance (0-1)

    Returns importance score from 1-10.
    """
    # Importance calculation algorithm
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

    Uses exponential decay: decay = e^(-lambda * days)
    where lambda = 0.023 (half-life of ~30 days)

    - **days_old**: Age of memory in days

    Returns decay factor (0-1), where 1 means no decay.
    """
    # Exponential decay with ~30 days half-life
    lambda_decay = 0.023
    decay_factor = math.exp(-lambda_decay * input.days_old)

    return {"decay_factor": round(decay_factor, 3)}
