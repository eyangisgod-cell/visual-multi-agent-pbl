"""
Agent collaboration demo script.
Tests the multi-agent workflow end-to-end.
"""

import asyncio
import json
from app.orchestrator import AgentOrchestrator
from app.llm.mock import create_mock_llm_config


async def run_demo():
    """Run agent collaboration demo."""
    print("=" * 60)
    print("AG2 Multi-Agent Collaboration Demo")
    print("=" * 60)

    # Initialize orchestrator with mock LLM
    llm_config = create_mock_llm_config()
    orchestrator = AgentOrchestrator(llm_config=llm_config, enable_logging=True)

    # Initialize all agents
    print("\n[1] Initializing agents...")
    orchestrator.initialize_agents()
    print(f"    Available agents: {list(orchestrator.agents.keys())}")

    # Test single agent delegation
    print("\n[2] Testing single agent delegation...")
    result = orchestrator.run_delegation(
        task="请为我制定一个学习 Python 的 30 天计划",
        target_agent="Mentor",
    )
    print(f"    Agent: {result.get('agent')}")
    print(f"    Success: {result.get('success')}")
    print(f"    Response preview: {str(result.get('response', ''))[:100]}...")

    # Test designer agent
    print("\n[3] Testing Designer agent...")
    result = orchestrator.run_delegation(
        task="为一个教育科技产品设计 logo 创意方案",
        target_agent="Designer",
    )
    print(f"    Response preview: {str(result.get('response', ''))[:100]}...")

    # Test analyst agent
    print("\n[4] Testing Analyst agent...")
    result = orchestrator.run_delegation(
        task="分析用户增长数据的关键趋势",
        target_agent="Analyst",
    )
    print(f"    Response preview: {str(result.get('response', ''))[:100]}...")

    # Test marketer agent
    print("\n[5] Testing Marketer agent...")
    result = orchestrator.run_delegation(
        task="为新产品制定社交媒体营销策略",
        target_agent="Marketer",
    )
    print(f"    Response preview: {str(result.get('response', ''))[:100]}...")

    # Test assistant coordinator
    print("\n[6] Testing Assistant (coordinator)...")
    result = orchestrator.run_delegation(
        task="协调团队完成一个完整的项目规划",
        target_agent="Assistant",
    )
    print(f"    Response preview: {str(result.get('response', ''))[:100]}...")

    # Test multi-agent collaboration setup
    print("\n[7] Setting up group chat for collaboration...")
    orchestrator.setup_group_chat(
        agent_names=["Assistant", "Mentor", "Designer", "Analyst", "Marketer"],
        max_rounds=10,
    )
    print("    Group chat configured!")

    # Run collaboration simulation
    print("\n[8] Running multi-agent collaboration...")
    task = "请为一个新的在线教育平台制定完整的产品规划和营销方案"

    async for event in orchestrator.run_collaboration(
        task=task,
        initiator="Assistant",
        max_turns=3,
    ):
        event_type = event.get("type")
        if event_type == "session_start":
            print(f"    Session started: {event.get('task')[:50]}...")
        elif event_type == "status":
            print(f"    Status: {event.get('status')}")
        elif event_type == "session_end":
            summary = event.get("summary", {})
            print(f"    Collaboration complete!")
            print(f"    Total messages: {summary.get('total_messages', 0)}")
            print(f"    Participants: {summary.get('participants', [])}")

    # Summary
    print("\n" + "=" * 60)
    print("Demo completed successfully!")
    print("=" * 60)
    print(f"""
Summary:
- Orchestrator: {orchestrator}
- Agents initialized: {len(orchestrator.agents)}
- Agent names: {list(orchestrator.agents.keys())}
- Group chat: {'configured' if orchestrator.group_chat else 'not configured'}
- Mock LLM calls: Simulated

Next steps:
1. Start the FastAPI server: uvicorn app.main:app --reload
2. Connect WebSocket client to: ws://localhost:8000/api/v1/agents/ws/chat/{{session_id}}
3. Send messages and receive streaming responses from agents
""")


if __name__ == "__main__":
    asyncio.run(run_demo())
