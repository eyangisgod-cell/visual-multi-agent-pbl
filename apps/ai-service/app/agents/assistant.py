"""
CEO 助手 (Assistant) Agent.
Acts as the main coordinator and executive assistant for users.
"""

from typing import Any, Dict, List, Optional
from .base import BaseAgent


class AssistantAgent(BaseAgent):
    """
    CEO 助手 - Executive assistant and coordinator agent.

    Responsibilities:
    - Coordinate tasks and manage workflows
    - Delegate work to specialized agents
    - Summarize information and provide recommendations
    - Schedule and track project progress
    - Act as the primary interface for users
    """

    def __init__(
        self,
        llm_config: Optional[Dict[str, Any]] = None,
    ):
        system_prompt = """You are CEO 助手 (CEO Assistant), an efficient and intelligent executive assistant.

Your role:
1. Serve as the primary interface between users and the AI agent team
2. Understand user requests and delegate to appropriate specialist agents
3. Coordinate multi-agent collaboration for complex tasks
4. Synthesize information from multiple sources into clear summaries
5. Track project progress and ensure timely completion
6. Anticipate needs and provide proactive suggestions
7. Maintain professional communication at all times

Communication style:
- Professional, courteous, and efficient
- Clear and concise in explanations
- Proactive in identifying issues and solutions
- Diplomatic when handling conflicts or concerns
- Adaptable to user's preferred communication style

You specialize in:
- Task coordination and project management
- Information synthesis and summarization
- Priority management and decision support
- Cross-functional collaboration
- Executive communication"""

        super().__init__(
            name="Assistant",
            system_prompt=system_prompt,
            llm_config=llm_config,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=20,
        )

        # Register agent-specific tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register tools specific to the Assistant agent."""
        self.register_tool(self.delegate_task, name="delegate_task")
        self.register_tool(self.summarize_discussion, name="summarize_discussion")
        self.register_tool(self.create_action_items, name="create_action_items")
        self.register_tool(self.prioritize_tasks, name="prioritize_tasks")

    def delegate_task(
        self,
        task_description: str,
        target_agent: str,
        priority: str = "medium",
        deadline: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Delegate a task to a specialized agent.

        Args:
            task_description: Clear description of the task
            target_agent: Name of the agent to delegate to
            priority: Task priority (low, medium, high, urgent)
            deadline: Optional deadline for the task
            context: Additional context or parameters

        Returns:
            Delegation confirmation with task details
        """
        valid_agents = ["Mentor", "Designer", "Analyst", "Marketer"]
        if target_agent not in valid_agents:
            return {
                "success": False,
                "error": f"Invalid agent: {target_agent}. Choose from: {valid_agents}",
            }

        return {
            "success": True,
            "task_id": f"task_{target_agent.lower()}_{id(task_description) % 10000}",
            "delegated_to": target_agent,
            "task_description": task_description,
            "priority": priority,
            "deadline": deadline,
            "context": context or {},
            "status": "pending",
        }

    def summarize_discussion(
        self,
        messages: List[Dict[str, Any]],
        key_points_only: bool = False,
    ) -> Dict[str, Any]:
        """
        Summarize a multi-agent discussion.

        Args:
            messages: List of messages from the discussion
            key_points_only: Return only key points if True

        Returns:
            Summary of the discussion
        """
        summary = {
            "participants": list(set(m.get("sender", "unknown") for m in messages)) if messages else [],
            "message_count": len(messages),
            "key_points": [],
            "decisions_made": [],
            "open_questions": [],
            "next_steps": [],
        }

        if key_points_only:
            return {"key_points": summary["key_points"]}

        return summary

    def create_action_items(
        self,
        discussion_summary: str,
        assignees: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Extract and create action items from a discussion.

        Args:
            discussion_summary: Summary of the discussion
            assignees: List of possible assignees

        Returns:
            List of action items with assignments
        """
        return [
            {
                "action": "Review and provide feedback",
                "assignee": assignees[0] if assignees else "unassigned",
                "priority": "medium",
                "status": "pending",
                "due_date": None,
            },
            {
                "action": "Implement agreed changes",
                "assignee": assignees[-1] if assignees and len(assignees) > 1 else "unassigned",
                "priority": "high",
                "status": "pending",
                "due_date": None,
            },
        ]

    def prioritize_tasks(
        self,
        tasks: List[Dict[str, Any]],
        criteria: str = "eisenhower",
    ) -> List[Dict[str, Any]]:
        """
        Prioritize a list of tasks.

        Args:
            tasks: List of tasks with descriptions
            criteria: Prioritization method (eisenhower, mow, custom)

        Returns:
            Prioritized list of tasks
        """
        priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}

        sorted_tasks = sorted(
            tasks,
            key=lambda t: priority_order.get(t.get("priority", "medium"), 2),
        )

        for i, task in enumerate(sorted_tasks):
            task["priority_rank"] = i + 1

        return sorted_tasks
