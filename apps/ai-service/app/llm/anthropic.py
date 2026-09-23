"""
Real LLM Provider using Anthropic Claude API.

Supports:
- Claude 3.5 Sonnet (recommended)
- Claude 3 Opus
- Claude 3 Haiku

Fallback to mock provider when API key is not available.
"""

import os
import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional
from anthropic import AsyncAnthropic


class AnthropicLLMProvider:
    """
    Anthropic Claude API provider for production use.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-20250514",
        max_retries: int = 3,
        timeout: int = 60,
    ):
        """
        Initialize Anthropic provider.

        Args:
            api_key: Anthropic API key (falls back to ANTHROPIC_API_KEY env var)
            model: Model to use (default: claude-sonnet-4-20250514)
            max_retries: Maximum number of retries on failure
            timeout: Request timeout in seconds
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.model = model
        self.max_retries = max_retries
        self.timeout = timeout

        if not self.api_key:
            raise ValueError(
                "Anthropic API key not provided. "
                "Set ANTHROPIC_API_KEY environment variable or pass api_key parameter."
            )

        self.client = AsyncAnthropic(
            api_key=self.api_key,
            timeout=self.timeout,
            max_retries=max_retries,
        )

        self.call_count = 0

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs: Any,
    ) -> str:
        """
        Generate a response using Claude API.

        Args:
            messages: Conversation messages
            system_prompt: System prompt
            temperature: Response creativity (0.0-1.0)
            max_tokens: Maximum response length
            **kwargs: Additional parameters

        Returns:
            Generated response text
        """
        self.call_count += 1

        # Extract user and assistant messages
        claude_messages = []
        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role in ["user", "assistant"]:
                claude_messages.append({"role": role, "content": content})

        # Call Claude API
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt or "You are a helpful assistant.",
            messages=claude_messages,
        )

        # Extract response text
        if response.content and len(response.content) > 0:
            return response.content[0].text
        return ""

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a response from Claude API.

        Args:
            messages: Conversation messages
            system_prompt: System prompt
            temperature: Response creativity (0.0-1.0)
            max_tokens: Maximum response length
            **kwargs: Additional parameters

        Yields:
            Response chunks
        """
        # Extract user and assistant messages
        claude_messages = []
        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role in ["user", "assistant"]:
                claude_messages.append({"role": role, "content": content})

        # Stream response
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt or "You are a helpful assistant.",
            messages=claude_messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        return {
            "model": self.model,
            "provider": "anthropic",
            "capabilities": ["chat", "completion", "streaming"],
            "is_mock": False,
            "call_count": self.call_count,
        }


# Global provider instance
_anthropic_provider: Optional[AnthropicLLMProvider] = None


def get_anthropic_provider(
    model: str = "claude-sonnet-4-20250514",
) -> Optional[AnthropicLLMProvider]:
    """
    Get Anthropic provider instance.

    Args:
        model: Model to use

    Returns:
        AnthropicLLMProvider instance or None if API key not available
    """
    global _anthropic_provider

    # Check if API key is available
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    if _anthropic_provider is None:
        try:
            _anthropic_provider = AnthropicLLMProvider(api_key=api_key, model=model)
        except ValueError:
            return None

    return _anthropic_provider


def create_anthropic_llm_config(
    model: str = "claude-sonnet-4-20250514",
) -> Dict[str, Any]:
    """
    Create Anthropic LLM configuration for AG2.

    Args:
        model: Model name

    Returns:
        AG2-compatible LLM config dict
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    return {
        "config_list": [
            {
                "model": model,
                "api_key": api_key,
                "model_type": "anthropic",
            }
        ],
        "cache_seed": None,
    }
