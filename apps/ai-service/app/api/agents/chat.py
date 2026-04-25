"""
WebSocket API for real-time agent chat and collaboration.
"""

import json
import asyncio
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse

from app.orchestrator import AgentOrchestrator, get_orchestrator
from app.agents import AssistantAgent

router = APIRouter(prefix="/agents", tags=["agents"])

# Store active connections
active_connections: Dict[str, WebSocket] = {}
# Store session states
session_states: Dict[str, Dict[str, Any]] = {}

# Map frontend agent types to backend agent names
AGENT_TYPE_MAP: Dict[str, str] = {
    "guide": "Mentor",
    "tutor": "Assistant",
    "evaluator": "Analyst",
    "collaborator": "Marketer",
    "creator": "Designer",
}


@router.websocket("/ws/chat/{session_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    session_id: str,
):
    """
    WebSocket endpoint for real-time agent chat.

    Supports:
    - Single agent queries
    - Multi-agent collaboration sessions
    - Streaming responses
    - Session management

    Message format (client -> server):
    {
        "type": "message" | "collaborate" | "delegate" | "stop",
        "content": "User message or task",
        "agent": "Optional target agent name",
        "config": "Optional configuration"
    }

    Message format (server -> client):
    {
        "type": "response" | "stream" | "status" | "error" | "complete",
        "content": "Response content",
        "agent": "Responding agent name",
        "metadata": "Additional metadata"
    }
    """
    await websocket.accept()
    active_connections[session_id] = websocket
    session_states[session_id] = {
        "messages": [],
        "current_agent": None,
        "status": "connected",
        "orchestrator": get_orchestrator(),
    }

    try:
        await send_status(websocket, "connected", "WebSocket connection established")

        while True:
            # Receive message from client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                await send_error(websocket, "Invalid JSON format")
                continue

            msg_type = message.get("type", "message")
            content = message.get("content", "")
            agent_name = message.get("agent", "Assistant")
            config = message.get("config", {})

            if msg_type == "stop":
                await send_status(websocket, "stopped", "Session stopped by user")
                break

            elif msg_type == "collaborate":
                # Multi-agent collaboration
                await handle_collaboration(
                    websocket, session_id, content, config
                )

            elif msg_type == "delegate":
                # Delegate to specific agent
                await handle_delegation(
                    websocket, session_id, content, agent_name, config
                )

            else:
                # Default: simple chat message
                await handle_chat_message(
                    websocket, session_id, content, agent_name, config
                )

    except WebSocketDisconnect:
        await cleanup_session(session_id)
    except Exception as e:
        await send_error(websocket, str(e))
        await cleanup_session(session_id)


async def handle_chat_message(
    websocket: WebSocket,
    session_id: str,
    content: str,
    agent_name: str,
    config: Dict[str, Any],
) -> None:
    """Handle a simple chat message to a single agent."""
    state = session_states.get(session_id)
    if not state:
        await send_error(websocket, "Session not found")
        return

    orchestrator = state["orchestrator"]
    agent = orchestrator.get_agent(agent_name)

    if not agent:
        await send_error(websocket, f"Agent '{agent_name}' not found")
        return

    # Store message in history
    state["messages"].append({"role": "user", "content": content})
    state["current_agent"] = agent_name

    # Generate response with streaming simulation
    await send_status(websocket, "processing", f"{agent_name} is thinking...")

    try:
        # Run agent in background and stream response
        response = await run_agent_with_streaming(agent, content, websocket)

        # Store response in history
        state["messages"].append({"role": "assistant", "content": response, "agent": agent_name})

        # Send completion
        await send_response(websocket, response, agent_name)
        await send_status(websocket, "complete", "Response complete")

    except Exception as e:
        await send_error(websocket, f"Agent error: {str(e)}")


async def handle_delegation(
    websocket: WebSocket,
    session_id: str,
    task: str,
    agent_name: str,
    config: Dict[str, Any],
) -> None:
    """Handle task delegation to a specific agent."""
    state = session_states.get(session_id)
    if not state:
        await send_error(websocket, "Session not found")
        return

    orchestrator = state["orchestrator"]

    await send_status(websocket, "delegating", f"Delegating to {agent_name}...")

    result = orchestrator.run_delegation(
        task=task,
        target_agent=agent_name,
        context=config,
    )

    if result.get("success"):
        response = result.get("response", "Task completed")
        await send_response(websocket, response, agent_name, {
            "task": task,
            "context": config,
        })
        await send_status(websocket, "complete", "Delegation complete")
    else:
        await send_error(websocket, result.get("error", "Delegation failed"))


async def handle_collaboration(
    websocket: WebSocket,
    session_id: str,
    task: str,
    config: Dict[str, Any],
) -> None:
    """Handle multi-agent collaboration session."""
    state = session_states.get(session_id)
    if not state:
        await send_error(websocket, "Session not found")
        return

    orchestrator = state["orchestrator"]

    max_turns = config.get("max_turns", 5)
    agents = config.get("agents", ["Assistant", "Mentor", "Designer", "Analyst", "Marketer"])

    await send_status(websocket, "starting", "Starting multi-agent collaboration...")

    # Set up group chat
    orchestrator.setup_group_chat(agent_names=agents, max_rounds=max_turns * 2)

    try:
        async for event in orchestrator.run_collaboration(
            task=task,
            initiator="Assistant",
            max_turns=max_turns,
        ):
            event_type = event.get("type")

            if event_type == "session_start":
                await send_status(
                    websocket, "collaborating",
                    f"Starting collaboration with {len(agents)} agents"
                )

            elif event_type == "message":
                msg = event.get("content", {})
                await send_stream(
                    websocket,
                    msg.get("content", ""),
                    msg.get("name", "unknown"),
                )

            elif event_type == "session_end":
                summary = event.get("summary", {})
                await send_response(
                    websocket,
                    json.dumps(summary, ensure_ascii=False),
                    "System",
                    {"type": "collaboration_summary"},
                )
                await send_status(websocket, "complete", "Collaboration complete")

    except Exception as e:
        await send_error(websocket, f"Collaboration error: {str(e)}")


async def run_agent_with_streaming(
    agent: AssistantAgent,
    content: str,
    websocket: WebSocket,
) -> str:
    """
    Run agent and simulate streaming response.

    In production, this would use actual streaming from the LLM.
    """
    # Get response from agent
    response = agent.generate_reply(
        messages=[{"role": "user", "content": content}],
    )

    # Simulate streaming by chunks
    if isinstance(response, str):
        chunks = response.split(" ")
        accumulated = ""
        for chunk in chunks:
            accumulated += chunk + " "
            await send_stream(websocket, accumulated, agent.name)
            await asyncio.sleep(0.05)  # Simulate streaming delay
        return accumulated.strip()

    return str(response)


async def send_response(
    websocket: WebSocket,
    content: str,
    agent: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """Send a complete response message."""
    message = {
        "type": "response",
        "content": content,
        "agent": agent,
        "timestamp": asyncio.get_event_loop().time(),
        **(metadata or {}),
    }
    await websocket.send_json(message)


async def send_stream(
    websocket: WebSocket,
    content: str,
    agent: str,
) -> None:
    """Send a streaming update."""
    message = {
        "type": "stream",
        "content": content,
        "agent": agent,
        "partial": True,
    }
    await websocket.send_json(message)


async def send_status(
    websocket: WebSocket,
    status: str,
    message: str,
) -> None:
    """Send a status update."""
    await websocket.send_json({
        "type": "status",
        "status": status,
        "message": message,
    })


async def send_error(
    websocket: WebSocket,
    error: str,
) -> None:
    """Send an error message."""
    await websocket.send_json({
        "type": "error",
        "error": error,
        "timestamp": asyncio.get_event_loop().time(),
    })


async def cleanup_session(session_id: str) -> None:
    """Clean up session resources."""
    if session_id in active_connections:
        del active_connections[session_id]
    if session_id in session_states:
        del session_states[session_id]


@router.get("/sessions")
async def list_sessions():
    """List active chat sessions."""
    return {
        "active_sessions": len(active_connections),
        "session_ids": list(active_connections.keys()),
    }


@router.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Get information about a specific session."""
    if session_id not in session_states:
        raise HTTPException(status_code=404, detail="Session not found")

    state = session_states[session_id]
    return {
        "session_id": session_id,
        "status": state["status"],
        "message_count": len(state["messages"]),
        "current_agent": state["current_agent"],
        "connected": session_id in active_connections,
    }


@router.post("/sessions/{session_id}/stop")
async def stop_session(session_id: str):
    """Stop a session."""
    if session_id in active_connections:
        try:
            await active_connections[session_id].send_json({
                "type": "status",
                "status": "stopped",
                "message": "Session stopped by API request",
            })
            await active_connections[session_id].close()
        except Exception:
            pass
        await cleanup_session(session_id)

    return {"message": f"Session {session_id} stopped"}


@router.get("/agents/list")
async def list_agents():
    """List available agents."""
    orchestrator = get_orchestrator()
    agents = orchestrator.get_all_agents()

    return {
        "agents": [
            {
                "name": name,
                "type": agent.__class__.__name__,
                "description": agent.system_prompt[:200] + "...",
            }
            for name, agent in agents.items()
        ]
    }


@router.post("/launch")
async def launch_agent(
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any],
):
    """
    Launch an AI agent for a task.

    Request body:
    {
        "agentType": "guide" | "tutor" | "evaluator" | "collaborator" | "creator",
        "taskId": "task-uuid",
        "taskTitle": "Task title",
        "taskDescription": "Optional task description"
    }
    """
    agent_type = payload.get("agentType")
    task_id = payload.get("taskId")
    task_title = payload.get("taskTitle", "")
    task_description = payload.get("taskDescription", "")

    if not agent_type or not task_id:
        raise HTTPException(
            status_code=400,
            detail="agentType and taskId are required"
        )

    backend_agent_name = AGENT_TYPE_MAP.get(agent_type)
    if not backend_agent_name:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown agent type: {agent_type}. Valid types: {list(AGENT_TYPE_MAP.keys())}"
        )

    orchestrator = get_orchestrator()

    # Start agent execution in background to avoid blocking the response
    background_tasks.add_task(
        _run_agent_task,
        orchestrator,
        backend_agent_name,
        task_id,
        task_title,
        task_description,
    )

    return {
        "status": "launched",
        "agentType": backend_agent_name,
        "taskId": task_id,
    }


async def _run_agent_task(
    orchestrator: AgentOrchestrator,
    agent_name: str,
    task_id: str,
    task_title: str,
    task_description: str,
) -> None:
    """Run agent delegation in background."""
    try:
        task_prompt = f"Task: {task_title}"
        if task_description:
            task_prompt += f"\nDescription: {task_description}"

        result = orchestrator.run_delegation(
            task=task_prompt,
            target_agent=agent_name,
            context={"taskId": task_id},
        )

        if result.get("success"):
            print(f"Agent {agent_name} completed task {task_id}")
        else:
            print(f"Agent {agent_name} failed task {task_id}: {result.get('error')}")
    except Exception as e:
        print(f"Error running agent task {task_id}: {e}")
