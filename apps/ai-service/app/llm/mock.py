"""
Mock LLM Provider for local development.
Simulates LLM responses without requiring API keys.
"""

import asyncio
import random
from typing import Any, AsyncGenerator, Dict, List, Optional


class MockLLMProvider:
    """
    Mock LLM provider for development and testing.

    Returns plausible responses based on keywords and context
    without making actual API calls.
    """

    def __init__(self, model: str = "mock-gpt-4", delay_ms: int = 100):
        """
        Initialize mock provider.

        Args:
            model: Model name to simulate
            delay_ms: Simulated latency per token in milliseconds
        """
        self.model = model
        self.delay_ms = delay_ms
        self.call_count = 0

        # Response templates for different agent roles
        self.templates = {
            "Mentor": [
                "这是一个很好的问题！让我来详细解释一下...\n\n首先，我们需要理解基本概念。{topic} 的核心原理是...\n\n关键要点：\n1. 基础概念很重要\n2. 实践出真知\n3. 循序渐进学习\n\n你有什么具体问题吗？",
                "作为你的学习导师，我建议这样规划学习路径：\n\n**第一阶段：基础**\n- 理解核心概念\n- 掌握基本术语\n\n**第二阶段：实践**\n- 动手练习\n- 解决实际问题\n\n**第三阶段：进阶**\n- 深入学习\n- 拓展应用\n\n准备好了吗？",
            ],
            "Designer": [
                "从设计角度，我有以下建议：\n\n**色彩方案：**\n主色：沉稳的蓝色系 (#1E3A5F)\n辅色：清新的浅蓝色 (#89B4D4)\n强调色：活力橙色 (#FF7F50)\n\n**排版建议：**\n- 标题：使用现代无衬线字体\n- 正文：易读性优先\n\n**视觉层次：**\n1. 突出核心信息\n2. 留白创造呼吸感\n3. 一致性原则",
                "这个创意概念很有潜力！我的设计思路：\n\n🎨 **视觉风格**：现代简约 + 温暖元素\n📐 **构图**：黄金比例分割\n✨ **亮点**：微交互动效\n\n让我为你生成详细的设计提示词...",
            ],
            "Analyst": [
                "基于数据分析，我发现以下趋势：\n\n**关键指标：**\n- 增长率：+15.3%\n- 转化率：3.2%\n- 留存率：68%\n\n**洞察：**\n1. 用户活跃度呈上升趋势\n2. 周末流量明显高于工作日\n3. 移动端占比持续增长\n\n**建议：**\n- 加大移动端优化投入\n- 针对周末推出特色活动",
                "数据汇总分析如下：\n\n📊 **样本总量**：10,000 条记录\n📈 **平均值**：较上月提升 12%\n⚠️ **异常点**：发现 3 处数据波动\n\n详细分析见附件报告。",
            ],
            "Marketer": [
                "针对这个产品，我建议的营销策略：\n\n🎯 **目标受众**：25-40 岁城市白领\n\n📱 **核心渠道**：\n- 小红书：种草内容\n- 抖音：短视频传播\n- 微信：私域运营\n\n💡 **创意方向**：\n\"让每一天都更高效\" \n\n📅 **推广节奏**：\n第 1 周：预热造势\n第 2-3 周：集中投放\n第 4 周：复盘优化",
                "广告文案创意：\n\n**标题：** 改变，从现在开始！\n\n**正文：**\n还在为效率低下而烦恼？\n成千上万的用户已经找到解决方案。\n\n✅ 节省 50% 时间\n✅ 提升 3 倍效率\n✅ 7 天无理由退款\n\n👉 立即体验，限时优惠！",
            ],
            "Assistant": [
                "收到！我来协调处理这个任务。\n\n📋 **任务分析：**\n- 类型：综合型任务\n- 涉及：多个专业领域\n- 优先级：中等\n\n🔄 **处理流程：**\n1. 分派给相关专家代理\n2. 汇总各方意见\n3. 形成最终方案\n\n请稍等，我正在联系相关团队成员...",
                "已为您整理以下信息：\n\n**任务摘要：**\n- 目标：完成项目规划\n- 参与：导师、设计师、分析师、运营师\n- 截止：待定\n\n**下一步行动：**\n1. 确认具体需求\n2. 分配专项任务\n3. 设定时间节点\n\n需要我详细说明哪部分？",
            ],
            "default": [
                "我已收到您的消息，正在处理中...\n\n请问还有什么可以帮助您的？",
                "感谢您的提问！让我思考一下...\n\n基于我的理解，建议如下：\n1. 先明确目标\n2. 制定详细计划\n3. 逐步执行\n\n有其他问题随时告诉我！",
            ],
        }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        agent_name: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """
        Generate a mock response.

        Args:
            messages: Conversation messages
            system_prompt: System prompt
            agent_name: Name of the agent
            temperature: Response randomness (not used in mock)
            max_tokens: Maximum response length

        Returns:
            Generated response text
        """
        self.call_count += 1

        # Extract keywords from messages
        user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break

        # Get template based on agent
        agent_templates = self.templates.get(
            agent_name,
            self.templates["default"],
        )

        # Select response with some randomness
        base_response = random.choice(agent_templates)

        # Try to personalize based on keywords
        if "设计" in user_message or "design" in user_message.lower():
            base_response = self.templates["Designer"][0]
        elif "学习" in user_message or "learn" in user_message.lower():
            base_response = self.templates["Mentor"][0]
        elif "数据" in user_message or "data" in user_message.lower():
            base_response = self.templates["Analyst"][0]
        elif "营销" in user_message or "market" in user_message.lower():
            base_response = self.templates["Marketer"][0]

        # Simulate processing delay
        await asyncio.sleep(self.delay_ms * 3 / 1000)

        return base_response[:max_tokens]

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        agent_name: Optional[str] = None,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a mock response token by token.

        Args:
            messages: Conversation messages
            system_prompt: System prompt
            agent_name: Name of the agent
            **kwargs: Additional parameters

        Yields:
            Response chunks
        """
        full_response = await self.generate_response(
            messages=messages,
            system_prompt=system_prompt,
            agent_name=agent_name,
            **kwargs,
        )

        # Stream word by word
        words = full_response.split(" ")
        for word in words:
            yield word + " "
            await asyncio.sleep(self.delay_ms / 1000)

    def get_model_info(self) -> Dict[str, Any]:
        """Get mock model information."""
        return {
            "model": self.model,
            "provider": "mock",
            "capabilities": ["chat", "completion"],
            "is_mock": True,
            "call_count": self.call_count,
        }


# Global mock provider instance
_mock_provider: Optional[MockLLMProvider] = None


def get_mock_provider(model: str = "mock-gpt-4") -> MockLLMProvider:
    """
    Get global mock provider instance.

    Args:
        model: Model name

    Returns:
        MockLLMProvider instance
    """
    global _mock_provider
    if _mock_provider is None:
        _mock_provider = MockLLMProvider(model=model)
    return _mock_provider


def create_mock_llm_config(model: str = "mock-gpt-4") -> Dict[str, Any]:
    """
    Create mock LLM configuration for AG2.

    Args:
        model: Model name

    Returns:
        AG2-compatible LLM config dict
    """
    return {
        "config_list": [
            {
                "model": model,
                "api_key": "mock-key",
                "base_url": "http://localhost:8000/mock/v1",
                "model_type": "mock",
            }
        ],
        "cache_seed": None,
    }
