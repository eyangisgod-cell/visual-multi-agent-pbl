"""
Base agent class for AG2 (AutoGen) AI agents.
Provides common functionality for all agent roles.
"""

from typing import Any, Optional, Callable, List, Dict, Union
from autogen import ConversableAgent


class BaseAgent:
    """
    Base class for all AI agents in the system.
    Wraps AG2's ConversableAgent with common configuration.
    """

    def __init__(
        self,
        name: str,
        system_prompt: str,
        llm_config: Optional[Dict[str, Any]] = None,
        human_input_mode: str = "NEVER",
        max_consecutive_auto_reply: int = 10,
    ):
        """
        Initialize a base agent.

        Args:
            name: Agent name/identifier
            system_prompt: System message defining agent's role and behavior
            llm_config: LLM configuration dict (provider, model, api_key, etc.)
            human_input_mode: One of "ALWAYS", "TERMINATE", "NEVER"
            max_consecutive_auto_reply: Maximum auto-replies before stopping
        """
        self.name = name
        self.system_prompt = system_prompt
        self.llm_config = llm_config or self._get_default_llm_config()
        self.human_input_mode = human_input_mode
        self.max_consecutive_auto_reply = max_consecutive_auto_reply

        # Create the AG2 ConversableAgent
        self.agent = ConversableAgent(
            name=name,
            system_message=system_prompt,
            llm_config=self.llm_config,
            human_input_mode=human_input_mode,
            max_consecutive_auto_reply=max_consecutive_auto_reply,
        )

    def _get_default_llm_config(self) -> Dict[str, Any]:
        """
        Get default LLM configuration for local development.
        Uses mock/mock provider for testing without API keys.
        """
        return {
            "config_list": [
                {
                    "model": "gpt-4",
                    "api_key": "mock-key-for-dev",
                    "base_url": "http://localhost:8000/v1",  # Mock LLM server
                }
            ],
            "cache_seed": None,
        }

    def register_reply(
        self,
        reply_func: Callable,
        position: int = 0,
        config: Optional[Any] = None,
        reset_config: Optional[Callable] = None,
    ) -> None:
        """
        Register a custom reply function for this agent.

        Args:
            reply_func: Function that generates replies
            position: Position in the reply function list
            config: Configuration for the reply function
            reset_config: Function to reset configuration
        """
        self.agent.register_reply(
            trigger=reply_func,
            reply_func=reply_func,
            position=position,
            config=config,
            reset_config=reset_config,
        )

    def register_tool(self, tool: Callable, name: Optional[str] = None) -> None:
        """
        Register a tool/function that this agent can use.

        Args:
            tool: The tool function
            name: Optional name for the tool
        """
        from autogen import register_function

        register_function(
            f=tool,
            caller=self.agent,
            executor=self.agent,
            name=name or tool.__name__,
        )

    def generate_reply(
        self,
        messages: Optional[List[Dict[str, Any]]] = None,
        sender: Optional["ConversableAgent"] = None,
        **kwargs: Any,
    ) -> Union[str, Dict[str, Any], None]:
        """
        Generate a reply based on the conversation history.

        Args:
            messages: List of conversation messages
            sender: The agent that sent the last message
            **kwargs: Additional arguments

        Returns:
            Generated reply message
        """
        return self.agent.generate_reply(messages=messages, sender=sender, **kwargs)

    def send(
        self,
        message: Union[str, Dict[str, Any]],
        recipient: "ConversableAgent",
        request_reply: bool = True,
        silent: bool = False,
    ) -> None:
        """
        Send a message to another agent.

        Args:
            message: Message to send
            recipient: Target agent
            request_reply: Whether to request a reply
            silent: Whether to suppress logging
        """
        self.agent.send(
            message=message,
            recipient=recipient,
            request_reply=request_reply,
            silent=silent,
        )

    def reset(self) -> None:
        """Reset the agent's conversation history."""
        self.agent.reset()

    @property
    def last_message(self) -> Optional[Dict[str, Any]]:
        """Get the last message received by this agent."""
        return self.agent.last_message()

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name='{self.name}')"
