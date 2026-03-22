"""
运营推广师 (Marketer) Agent.
Handles marketing strategy, content creation, and campaign planning.
"""

from typing import Any, Dict, List, Optional
from .base import BaseAgent


class MarketerAgent(BaseAgent):
    """
    运营推广师 - Marketing and promotion specialist agent.

    Responsibilities:
    - Develop marketing strategies and campaigns
    - Create engaging marketing content
    - Analyze market trends and competitor activity
    - Plan social media and advertising campaigns
    - Optimize conversion funnels and user engagement
    """

    def __init__(
        self,
        llm_config: Optional[Dict[str, Any]] = None,
    ):
        system_prompt = """You are 运营推广师 (Marketing Specialist), a creative and strategic marketing professional.

Your role:
1. Develop comprehensive marketing strategies and campaigns
2. Create compelling marketing copy and content
3. Analyze market trends, target audiences, and competitors
4. Plan and optimize social media presence
5. Design conversion funnels and user acquisition strategies
6. Measure campaign performance and ROI
7. Build brand awareness and engagement

Communication style:
- Persuasive and engaging
- Customer-focused and empathetic
- Data-informed but creative
- Action-oriented with clear CTAs
- Adapt tone to target audience

You specialize in:
- Digital marketing and social media
- Content marketing and storytelling
- SEO and SEM fundamentals
- Email marketing campaigns
- Growth hacking strategies
- Brand positioning and messaging
- A/B testing and optimization"""

        super().__init__(
            name="Marketer",
            system_prompt=system_prompt,
            llm_config=llm_config,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=15,
        )

        # Register agent-specific tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register tools specific to the Marketer agent."""
        self.register_tool(self.create_campaign_plan, name="create_campaign_plan")
        self.register_tool(self.generate_ad_copy, name="generate_ad_copy")
        self.register_tool(self.analyze_target_audience, name="analyze_target_audience")
        self.register_tool(self.suggest_channels, name="suggest_channels")

    def create_campaign_plan(
        self,
        product: str,
        goal: str = "awareness",
        budget: str = "medium",
        duration_days: int = 30,
        target_audience: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a comprehensive marketing campaign plan.

        Args:
            product: Product or service to promote
            goal: Campaign goal (awareness, leads, sales, retention)
            budget: Budget level (low, medium, high)
            duration_days: Campaign duration in days
            target_audience: Description of target audience

        Returns:
            Campaign plan with phases and tactics
        """
        goal_tactics = {
            "awareness": ["Social media buzz", "Influencer partnerships", "PR outreach"],
            "leads": ["Lead magnets", "Webinar series", "Content upgrades"],
            "sales": ["Limited offers", "Retargeting ads", "Email sequences"],
            "retention": ["Loyalty programs", "Exclusive content", "Community building"],
        }

        phases = [
            {
                "phase": "Launch",
                "days": "1-7",
                "focus": "Build anticipation and initial awareness",
                "tactics": goal_tactics.get(goal, goal_tactics["awareness"])[:2],
            },
            {
                "phase": "Growth",
                "days": "8-21",
                "focus": "Scale successful channels and optimize",
                "tactics": goal_tactics.get(goal, goal_tactics["awareness"]),
            },
            {
                "phase": "Conversion",
                "days": "22-30",
                "focus": "Drive conversions and measure results",
                "tactics": ["Urgency messaging", "Social proof", "Clear CTAs"],
            },
        ]

        return {
            "product": product,
            "goal": goal,
            "budget_level": budget,
            "duration_days": duration_days,
            "target_audience": target_audience or "General audience",
            "phases": phases,
            "kpis": [
                {"metric": "Reach/Impressions", "target": "based on budget"},
                {"metric": "Engagement Rate", "target": "3-5%"},
                {"metric": "Conversion Rate", "target": "2-4%"},
                {"metric": "ROI", "target": "3:1 or higher"},
            ],
        }

    def generate_ad_copy(
        self,
        product: str,
        platform: str = "facebook",
        tone: str = "friendly",
        variations: int = 3,
    ) -> List[Dict[str, str]]:
        """
        Generate advertising copy for different platforms.

        Args:
            product: Product or service to advertise
            platform: Ad platform (facebook, google, linkedin, tiktok, etc.)
            tone: Copy tone (friendly, professional, urgent, playful)
            variations: Number of copy variations to generate

        Returns:
            List of ad copy variations with headlines and descriptions
        """
        platform_specs = {
            "facebook": {"headline_limit": 40, "text_limit": 125, "emoji": True},
            "google": {"headline_limit": 30, "text_limit": 90, "emoji": False},
            "linkedin": {"headline_limit": 50, "text_limit": 150, "emoji": False},
            "tiktok": {"headline_limit": 34, "text_limit": 100, "emoji": True},
            "twitter": {"headline_limit": 0, "text_limit": 280, "emoji": True},
        }

        spec = platform_specs.get(platform, platform_specs["facebook"])

        copies = []
        for i in range(variations):
            copy = {
                "variation": i + 1,
                "platform": platform,
                "headline": f"Transform Your [Benefit] with {product}!",
                "primary_text": f"Discover why thousands trust {product} to [solve problem]. "
                                f"Start your journey today!",
                "cta": "Learn More",
                "tone": tone,
            }
            copies.append(copy)

        return copies

    def analyze_target_audience(
        self,
        product: str,
        existing_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze and define target audience segments.

        Args:
            product: Product or service to analyze
            existing_data: Any existing customer/market data

        Returns:
            Target audience analysis with personas
        """
        return {
            "product": product,
            "primary_segment": {
                "name": "Primary Target",
                "demographics": "25-45 years, urban professionals",
                "psychographics": "Value quality, tech-savvy, early adopters",
                "pain_points": ["Time constraints", "Information overload", "Trust issues"],
                "motivations": ["Efficiency", "Status", "Innovation"],
                "preferred_channels": ["Social media", "Search", "Email"],
            },
            "secondary_segment": {
                "name": "Secondary Target",
                "demographics": "18-30 years, students and young professionals",
                "psychographics": "Budget-conscious, social media active",
                "pain_points": ["Limited budget", "Learning curve", "Comparison paralysis"],
                "motivations": ["Affordability", "Peer approval", "Quick results"],
                "preferred_channels": ["TikTok", "Instagram", "YouTube"],
            },
            "recommendations": [
                "Focus on value proposition in messaging",
                "Use social proof and testimonials",
                "Create educational content to build trust",
            ],
        }

    def suggest_channels(
        self,
        budget: str = "medium",
        goal: str = "awareness",
        audience_age: str = "25-44",
    ) -> List[Dict[str, Any]]:
        """
        Suggest optimal marketing channels based on constraints.

        Args:
            budget: Budget level (low, medium, high)
            goal: Marketing goal (awareness, leads, sales, retention)
            audience_age: Primary age demographic

        Returns:
            Ranked list of recommended channels with allocation
        """
        channels = [
            {
                "channel": "Social Media (Organic)",
                "cost": "low",
                "effort": "medium",
                "best_for": ["awareness", "engagement"],
                "recommended_allocation": "20%",
            },
            {
                "channel": "Paid Social Ads",
                "cost": "medium",
                "effort": "low",
                "best_for": ["awareness", "leads", "sales"],
                "recommended_allocation": "30%",
            },
            {
                "channel": "Content Marketing/SEO",
                "cost": "low",
                "effort": "high",
                "best_for": ["awareness", "leads", "retention"],
                "recommended_allocation": "15%",
            },
            {
                "channel": "Email Marketing",
                "cost": "low",
                "effort": "medium",
                "best_for": ["leads", "sales", "retention"],
                "recommended_allocation": "15%",
            },
            {
                "channel": "Search Ads (SEM)",
                "cost": "high",
                "effort": "medium",
                "best_for": ["leads", "sales"],
                "recommended_allocation": "20%",
            },
        ]

        # Filter and rank by goal
        ranked = sorted(
            channels,
            key=lambda c: (
                goal in c["best_for"],
                c["cost"] == budget or c["cost"] == "low",
            ),
            reverse=True,
        )

        return ranked
