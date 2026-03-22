# AG2 (AutoGen) AI Agent Services

Phase 4 implementation of multi-agent collaboration using AG2 (pyautogen) framework.

## Architecture

```
apps/ai-service/
├── app/
│   ├── agents/           # Agent definitions
│   │   ├── base.py       # BaseAgent class (wraps ConversableAgent)
│   │   ├── mentor.py     # 智慧导师 - Educational mentor
│   │   ├── designer.py   # 创意设计师 - Creative designer
│   │   ├── analyst.py    # 数据分析师 - Data analyst
│   │   ├── marketer.py   # 运营推广师 - Marketing specialist
│   │   ├── assistant.py  # CEO 助手 - Coordinator/Assistant
│   │   └── __init__.py
│   ├── api/agents/
│   │   └── chat.py       # WebSocket API for agent chat
│   ├── llm/
│   │   └── mock.py       # Mock LLM provider for dev
│   └── orchestrator.py   # Agent workflow coordinator
└── demo_agents.py        # Demo/test script
```

## Agent Roles

| Agent | Role | Responsibilities |
|-------|------|------------------|
| Mentor | 智慧导师 | Learning guidance, tutoring, study plans |
| Designer | 创意设计师 | Creative concepts, visual design, branding |
| Analyst | 数据分析师 | Data analysis, insights, trends |
| Marketer | 运营推广师 | Marketing strategy, campaigns, content |
| Assistant | CEO 助手 | Task coordination, delegation, summarization |

## Quick Start

### 1. Install Dependencies

```bash
cd apps/ai-service
pip install -r requirements.txt
```

### 2. Run Demo

```bash
python demo_agents.py
```

### 3. Start Server

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Connect WebSocket Client

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/agents/ws/chat/session123');

// Send message to single agent
ws.send(JSON.stringify({
  type: 'message',
  content: '请为我制定学习计划',
  agent: 'Mentor'
}));

// Request multi-agent collaboration
ws.send(JSON.stringify({
  type: 'collaborate',
  content: '为新产品制定完整方案',
  config: {
    agents: ['Assistant', 'Mentor', 'Designer', 'Analyst', 'Marketer'],
    max_turns: 5
  }
}));
```

## API Endpoints

### WebSocket

- `WS /api/v1/agents/ws/chat/{session_id}` - Real-time agent chat

### REST

- `GET /api/v1/agents/sessions` - List active sessions
- `GET /api/v1/agents/sessions/{session_id}` - Get session info
- `POST /api/v1/agents/sessions/{session_id}/stop` - Stop session
- `GET /api/v1/agents/agents/list` - List available agents

## Message Format

### Client → Server

```json
{
  "type": "message | collaborate | delegate | stop",
  "content": "Your message or task",
  "agent": "Assistant",  // Optional, defaults to Assistant
  "config": {}  // Optional configuration
}
```

### Server → Client

```json
{
  "type": "response | stream | status | error | complete",
  "content": "Response content",
  "agent": "AgentName",
  "metadata": {}
}
```

## Configuration

### LLM Configuration (Development)

Uses mock LLM provider by default:

```python
from app.llm.mock import create_mock_llm_config

llm_config = create_mock_llm_config()
# Returns config with mock-key and localhost base_url
```

### Production LLM Configuration

```python
llm_config = {
    "config_list": [
        {
            "model": "gpt-4",
            "api_key": "your-api-key",
            "base_url": "https://api.openai.com/v1",
        }
    ],
    "cache_seed": None,
}
```

## Orchestrator Usage

```python
from app.orchestrator import AgentOrchestrator, get_orchestrator

# Get singleton instance
orchestrator = get_orchestrator()

# Or create new instance
orchestrator = AgentOrchestrator(llm_config=your_config)
orchestrator.initialize_agents()

# Single agent delegation
result = orchestrator.run_delegation(
    task="Analyze sales data",
    target_agent="Analyst",
)

# Multi-agent collaboration
orchestrator.setup_group_chat(agent_names=["Assistant", "Designer", "Marketer"])
async for event in orchestrator.run_collaboration(
    task="Create product launch plan",
    max_turns=5,
):
    print(event)
```

## Testing

```bash
# Run demo script
python demo_agents.py

# Test WebSocket endpoint (using websocat or similar)
websocat ws://localhost:8000/api/v1/agents/ws/chat/test123
```

## Dependencies

- `pyautogen[openai]==0.7.5` - AG2 (AutoGen) framework
- `fastapi` - Web framework
- `websockets` - WebSocket support
- Mock LLM provider included for local development

## Notes

- Mock LLM provider simulates responses without API keys
- Each agent has specialized system prompts and tools
- WebSocket supports streaming responses
- Session state is stored in memory (use Redis for production)
