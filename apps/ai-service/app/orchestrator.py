"""
Agent Workflow Orchestrator.
Coordinates multi-agent collaboration using AG2 group chat patterns.
"""

from typing import Any, Dict, List, Optional, Callable, AsyncGenerator
from autogen import GroupChat, GroupChatManager

from .agents import (
    BaseAgent,
    MentorAgent,
    DesignerAgent,
    AnalystAgent,
    MarketerAgent,
    AssistantAgent,
)


class AgentOrchestrator:
    """
    Orchestrates multi-agent collaboration workflows.

    Manages agent initialization, group conversations, and task delegation.
    """

    def __init__(
        self,
        llm_config: Optional[Dict[str, Any]] = None,
        enable_logging: bool = True,
    ):
        """
        Initialize the orchestrator.

        Args:
            llm_config: LLM configuration for all agents
            enable_logging: Enable conversation logging
        """
        self.llm_config = llm_config or self._get_default_llm_config()
        self.enable_logging = enable_logging
        self.agents: Dict[str, BaseAgent] = {}
        self.group_chat: Optional[GroupChat] = None
        self.group_chat_manager: Optional[GroupChatManager] = None
        self._initialized = False

    def _get_default_llm_config(self) -> Dict[str, Any]:
        """Get default LLM configuration."""
        return {
            "config_list": [
                {
                    "model": "gpt-4",
                    "api_key": "mock-key-for-dev",
                    "base_url": "http://localhost:8000/v1",
                }
            ],
            "cache_seed": None,
        }

    def initialize_agents(self, agent_names: Optional[List[str]] = None) -> None:
        """
        Initialize specified agents.

        Args:
            agent_names: List of agent names to initialize.
                        If None, initializes all available agents.
        """
        available_agents = {
            "Mentor": MentorAgent,
            "Designer": DesignerAgent,
            "Analyst": AnalystAgent,
            "Marketer": MarketerAgent,
            "Assistant": AssistantAgent,
        }

        names_to_init = agent_names or list(available_agents.keys())

        for name in names_to_init:
            if name in available_agents:
                agent_class = available_agents[name]
                self.agents[name] = agent_class(llm_config=self.llm_config)
                if self.enable_logging:
                    print(f"Initialized agent: {name}")

        self._initialized = True

    def setup_group_chat(
        self,
        agent_names: Optional[List[str]] = None,
        max_rounds: int = 10,
    ) -> None:
        """
        Set up a group chat for multi-agent collaboration.

        Args:
            agent_names: Agents to include in group chat
            max_rounds: Maximum conversation rounds
        """
        if not self._initialized:
            self.initialize_agents(agent_names)

        names_to_include = agent_names or list(self.agents.keys())
        ag2_agents = [self.agents[name].agent for name in names_to_include if name in self.agents]

        if not ag2_agents:
            raise ValueError("No agents available for group chat")

        self.group_chat = GroupChat(
            agents=ag2_agents,
            messages=[],
            max_round=max_rounds,
        )

        self.group_chat_manager = GroupChatManager(
            groupchat=self.group_chat,
            llm_config=self.llm_config,
        )

    async def run_collaboration(
        self,
        task: str,
        initiator: str = "Assistant",
        max_turns: int = 10,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Run a multi-agent collaboration session.

        Args:
            task: Task description to work on
            initiator: Agent to start the conversation
            max_turns: Maximum conversation turns

        Yields:
            Stream of agent messages and responses
        """
        if not self.group_chat_manager:
            self.setup_group_chat()

        if initiator not in self.agents:
            initiator = "Assistant"

        initiator_agent = self.agents[initiator].agent

        # Yield start event
        yield {
            "type": "session_start",
            "task": task,
            "initiator": initiator,
            "max_turns": max_turns,
        }

        # Start the conversation
        try:
            await initiator_agent.a_initiate_chat(
                self.group_chat_manager,
                message=task,
                max_turns=max_turns,
            )

            # Process and yield messages
            for message in self.group_chat.messages:
                yield {
                    "type": "message",
                    "content": message,
                }

            # Yield summary
            yield {
                "type": "session_end",
                "summary": self._generate_summary(),
                "total_turns": len(self.group_chat.messages),
            }

        except Exception as e:
            yield {
                "type": "error",
                "error": str(e),
            }

    def run_delegation(
        self,
        task: str,
        target_agent: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Run a single-agent delegation task.

        Args:
            task: Task to delegate
            target_agent: Agent to handle the task
            context: Additional context

        Returns:
            Agent response
        """
        if target_agent not in self.agents:
            return {
                "success": False,
                "error": f"Agent '{target_agent}' not found",
            }

        agent = self.agents[target_agent]
        response = agent.generate_reply(
            messages=[{"role": "user", "content": task}],
        )

        return {
            "success": True,
            "agent": target_agent,
            "task": task,
            "response": response,
            "context": context or {},
        }

    def _generate_summary(self) -> Dict[str, Any]:
        """Generate a summary of the collaboration session."""
        if not self.group_chat:
            return {"messages": 0, "participants": 0}

        return {
            "total_messages": len(self.group_chat.messages),
            "participants": list(set(m.get("name", "unknown") for m in self.group_chat.messages)),
            "message_types": self._count_message_types(),
        }

    def _count_message_types(self) -> Dict[str, int]:
        """Count messages by type/sender."""
        type_counts: Dict[str, int] = {}
        if self.group_chat:
            for msg in self.group_chat.messages:
                sender = msg.get("name", "unknown")
                type_counts[sender] = type_counts.get(sender, 0) + 1
        return type_counts

    def get_agent(self, name: str) -> Optional[BaseAgent]:
        """Get a specific agent by name."""
        return self.agents.get(name)

    def get_all_agents(self) -> Dict[str, BaseAgent]:
        """Get all initialized agents."""
        return self.agents.copy()

    def reset(self) -> None:
        """Reset the orchestrator state."""
        for agent in self.agents.values():
            agent.reset()
        if self.group_chat:
            self.group_chat.messages = []

    def register_custom_agent(
        self,
        name: str,
        agent: BaseAgent,
    ) -> None:
        """
        Register a custom agent.

        Args:
            name: Name for the custom agent
            agent: The agent instance
        """
        self.agents[name] = agent
        if self.enable_logging:
            print(f"Registered custom agent: {name}")

    def create_workflow(
        self,
        name: str,
        steps: List[Dict[str, Any]],
    ) -> "AgentWorkflow":
        """
        Create a custom agent workflow.

        Args:
            name: Workflow name
            steps: List of workflow steps

        Returns:
            Configured AgentWorkflow instance
        """
        return AgentWorkflow(name, steps, self)


class AgentWorkflow:
    """
    Custom multi-step agent workflow.
    """

    def __init__(
        self,
        name: str,
        steps: List[Dict[str, Any]],
        orchestrator: AgentOrchestrator,
    ):
        self.name = name
        self.steps = steps
        self.orchestrator = orchestrator
        self.results: List[Dict[str, Any]] = []

    async def execute(
        self,
        input_data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Execute the workflow.

        Args:
            input_data: Input data for the workflow

        Returns:
            List of results from each step
        """
        self.results = []
        current_context = input_data

        for step in self.steps:
            agent_name = step.get("agent")
            action = step.get("action", "process")
            params = step.get("params", {})

            if agent_name not in self.orchestrator.agents:
                self.results.append({
                    "step": step,
                    "error": f"Agent '{agent_name}' not found",
                })
                continue

            result = self.orchestrator.run_delegation(
                task=f"{action}: {current_context}",
                target_agent=agent_name,
                context=params,
            )

            self.results.append(result)
            current_context = {**current_context, **result}

        return self.results


# Singleton instance for global access
_orchestrator_instance: Optional[AgentOrchestrator] = None


def get_orchestrator(
    llm_config: Optional[Dict[str, Any]] = None,
    force_new: bool = False,
) -> AgentOrchestrator:
    """
    Get the global orchestrator instance.

    Args:
        llm_config: LLM configuration (used only for new instances)
        force_new: Force creation of new instance

    Returns:
        AgentOrchestrator instance
    """
    global _orchestrator_instance

    if force_new or _orchestrator_instance is None:
        _orchestrator_instance = AgentOrchestrator(llm_config=llm_config)
        _orchestrator_instance.initialize_agents()

    return _orchestrator_instance
