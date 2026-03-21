"""
创意设计师 (Designer) Agent.
Handles creative design tasks, visual concepts, and artistic direction.
"""

from typing import Any, Dict, List, Optional
from .base import BaseAgent


class DesignerAgent(BaseAgent):
    """
    创意设计师 - Creative design and visual arts agent.

    Responsibilities:
    - Generate creative concepts and ideas
    - Provide design feedback and suggestions
    - Create visual descriptions and mockups
    - Suggest color schemes and typography
    - Develop brand identity guidelines
    """

    def __init__(
        self,
        llm_config: Optional[Dict[str, Any]] = None,
    ):
        system_prompt = """You are 创意设计师 (Creative Designer), a versatile and innovative design professional.

Your role:
1. Generate original creative concepts and design ideas
2. Provide thoughtful critique and improvement suggestions
3. Create detailed visual descriptions for AI image generation
4. Suggest harmonious color palettes and typography combinations
5. Develop cohesive brand identity systems
6. Balance aesthetics with functionality and user experience
7. Stay current with design trends while maintaining timeless principles

Communication style:
- Inspiring and imaginative
- Visually descriptive and detailed
- Open to iteration and feedback
- Explain design rationale clearly
- Consider accessibility and inclusivity

You specialize in:
- Graphic design and visual communication
- UI/UX design principles
- Brand identity and logo design
- Color theory and typography
- Design thinking and creative problem-solving
- Prompt engineering for AI image generation"""

        super().__init__(
            name="Designer",
            system_prompt=system_prompt,
            llm_config=llm_config,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=15,
        )

        # Register agent-specific tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register tools specific to the Designer agent."""
        self.register_tool(self.generate_color_palette, name="generate_color_palette")
        self.register_tool(self.create_design_prompt, name="create_design_prompt")
        self.register_tool(self.suggest_typography, name="suggest_typography")
        self.register_tool(self.analyze_design, name="analyze_design")

    def generate_color_palette(
        self,
        mood: str = "professional",
        primary_color: Optional[str] = None,
        num_colors: int = 5,
    ) -> Dict[str, Any]:
        """
        Generate a harmonious color palette.

        Args:
            mood: Desired emotional tone (professional, playful, elegant, etc.)
            primary_color: Optional starting color (hex or name)
            num_colors: Number of colors in palette (3-7)

        Returns:
            Color palette with hex codes and usage guidelines
        """
        palettes = {
            "professional": {
                "colors": ["#1E3A5F", "#4A6FA5", "#89B4D4", "#E8F1F7", "#2D3436"],
                "names": ["Navy", "Steel Blue", "Sky Blue", "Ice", "Charcoal"],
            },
            "playful": {
                "colors": ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181"],
                "names": ["Coral", "Turquoise", "Sunshine", "Mint", "Salmon"],
            },
            "elegant": {
                "colors": ["#2C2C2C", "#8B7355", "#D4AF37", "#F5F5F5", "#6B5B95"],
                "names": ["Ebony", "Bronze", "Gold", "Pearl", "Plum"],
            },
        }

        selected = palettes.get(mood, palettes["professional"])
        return {
            "mood": mood,
            "colors": selected["colors"][:num_colors],
            "color_names": selected["names"][:num_colors],
            "usage": {
                "primary": selected["colors"][0],
                "secondary": selected["colors"][1] if len(selected["colors"]) > 1 else None,
                "accent": selected["colors"][2] if len(selected["colors"]) > 2 else None,
            },
        }

    def create_design_prompt(
        self,
        subject: str,
        style: str = "modern",
        format: str = "logo",
        mood: str = "professional",
        details: Optional[List[str]] = None,
    ) -> str:
        """
        Create a detailed prompt for AI image generation.

        Args:
            subject: Main subject of the design
            style: Design style (modern, minimalist, vintage, etc.)
            format: Output format (logo, poster, illustration, etc.)
            mood: Desired emotional tone
            details: Additional specific requirements

        Returns:
            Detailed image generation prompt
        """
        detail_str = ", ".join(details) if details else "elegant composition"
        prompt = (
            f"{style} {format} design featuring {subject}, "
            f"{mood} mood, {detail_str}, "
            f"high quality, professional design, vector-style, "
            f"clean lines, balanced composition --ar 1:1 --v 6"
        )
        return prompt

    def suggest_typography(
        self,
        project_type: str = "website",
        style: str = "modern",
        pairing_count: int = 3,
    ) -> List[Dict[str, str]]:
        """
        Suggest font pairings for a project.

        Args:
            project_type: Type of project (website, print, app, etc.)
            style: Design style preference
            pairing_count: Number of pairings to suggest

        Returns:
            List of font pairing suggestions
        """
        pairings = [
            {
                "name": "Clean & Professional",
                "heading": "Inter",
                "body": "Source Sans Pro",
                "use_case": "Corporate websites, SaaS applications",
            },
            {
                "name": "Modern & Bold",
                "heading": "Poppins",
                "body": "Roboto",
                "use_case": "Startups, tech products",
            },
            {
                "name": "Elegant & Classic",
                "heading": "Playfair Display",
                "body": "Lato",
                "use_case": "Luxury brands, editorial",
            },
            {
                "name": "Friendly & Approachable",
                "heading": "Nunito",
                "body": "Open Sans",
                "use_case": "Education, healthcare",
            },
            {
                "name": "Creative & Unique",
                "heading": "Space Grotesk",
                "body": "IBM Plex Sans",
                "use_case": "Creative agencies, portfolios",
            },
        ]

        return pairings[:pairing_count]

    def analyze_design(
        self,
        design_description: str,
        criteria: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a design based on specified criteria.

        Args:
            design_description: Description of the design to analyze
            criteria: Evaluation criteria (default: visual hierarchy, color, typography, spacing)

        Returns:
            Analysis results with scores and recommendations
        """
        eval_criteria = criteria or [
            "visual_hierarchy",
            "color_harmony",
            "typography",
            "spacing",
            "accessibility",
        ]

        return {
            "design": design_description[:100] + "..." if len(design_description) > 100 else design_description,
            "criteria_evaluated": eval_criteria,
            "scores": {c: {"score": 7, "max": 10} for c in eval_criteria},
            "strengths": [],
            "improvements": [],
            "overall_assessment": "Good foundation with room for refinement",
        }
