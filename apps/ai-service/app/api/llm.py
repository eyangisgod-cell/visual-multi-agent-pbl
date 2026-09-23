"""
LLM chat endpoint with support for both real (Anthropic) and mock providers.

Endpoints:
- POST /api/v1/llm/chat - Chat with LLM
- POST /api/v1/llm/embedding - Generate embedding for text

Provider selection:
- If ANTHROPIC_API_KEY is set, uses Anthropic Claude API
- Otherwise, falls back to mock provider for local development
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import time

from app.api.memory import generate_embedding
from app.llm.mock import get_mock_provider
from app.llm.anthropic import get_anthropic_provider

router = APIRouter(prefix="/llm", tags=["llm"])


class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'system', 'user', or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Conversation messages")
    temperature: Optional[float] = Field(default=0.7, ge=0, le=2, description="Response temperature")
    max_tokens: Optional[int] = Field(default=1024, ge=1, le=4096, description="Max response tokens")
    stream: Optional[bool] = Field(default=False, description="Whether to stream response")


class ChatResponse(BaseModel):
    response: str = Field(..., description="Generated response")
    usage: Dict[str, int] = Field(..., description="Token usage statistics")
    model: str = Field(..., description="Model used for generation")


class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="Text to embed")


class EmbeddingResponse(BaseModel):
    embedding: List[float] = Field(..., description="Embedding vector")
    dimensions: int = Field(..., description="Embedding dimensions")
    model: str = Field(..., description="Embedding model used")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with LLM to generate responses.

    Uses Anthropic Claude API if ANTHROPIC_API_KEY is set.
    Otherwise, falls back to mock provider for local development.
    """
    try:
        # Try to get real provider first
        provider = get_anthropic_provider(model="claude-sonnet-4-20250514")

        if provider is None:
            # Fall back to mock provider
            provider = get_mock_provider("mock-gpt-4")
            model_name = "mock-gpt-4"
        else:
            model_name = provider.model

        # Convert messages to dict format
        messages_dict = [msg.dict() for msg in request.messages]

        # Generate response
        response_text = await provider.generate_response(
            messages=messages_dict,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        # Calculate token counts
        if provider.get_model_info().get("is_mock", False):
            # Mock token calculation
            prompt_tokens = sum(len(msg.content.split()) for msg in request.messages)
            completion_tokens = len(response_text.split())
        else:
            # Real token estimation (approximate)
            prompt_tokens = sum(len(msg.content) // 4 for msg in request.messages)
            completion_tokens = len(response_text) // 4

        return ChatResponse(
            response=response_text,
            usage={
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
            model=model_name,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@router.post("/embedding", response_model=EmbeddingResponse)
async def generate_embedding_endpoint(request: EmbeddingRequest):
    """
    Generate embedding vector for text.

    Uses sentence-transformers for local embedding generation.
    """
    try:
        # Generate embedding
        embedding = generate_embedding(request.text)

        return EmbeddingResponse(
            embedding=embedding,
            dimensions=len(embedding),
            model="all-MiniLM-L6-v2",
        )

    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Embedding model not available. Install sentence-transformers."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding error: {str(e)}")
