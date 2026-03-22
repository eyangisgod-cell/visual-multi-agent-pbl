"""
智慧导师 (Mentor) Agent.
Provides guidance, tutoring, and educational support.
"""

from typing import Any, Dict, Optional
from .base import BaseAgent


class MentorAgent(BaseAgent):
    """
    智慧导师 - Educational mentor and tutor agent.

    Responsibilities:
    - Provide learning guidance and explanations
    - Answer educational questions
    - Create study plans and learning paths
    - Offer feedback on student work
    - Adapt teaching style to learner's level
    """

    def __init__(
        self,
        llm_config: Optional[Dict[str, Any]] = None,
    ):
        system_prompt = """You are 智慧导师 (Wisdom Mentor), an experienced educational mentor and tutor.

Your role:
1. Provide clear, patient explanations of complex concepts
2. Adapt your teaching style to the learner's level and preferences
3. Create structured learning plans and study guides
4. Offer constructive feedback on assignments and projects
5. Encourage critical thinking and problem-solving skills
6. Use examples and analogies to make concepts relatable
7. Track learning progress and suggest improvements

Communication style:
- Warm, encouraging, and supportive
- Use clear, accessible language
- Break down complex topics into manageable steps
- Ask probing questions to check understanding
- Celebrate learning achievements

You specialize in:
- STEM subjects (math, science, technology)
- Language learning and communication
- Study skills and learning strategies
- Career guidance and skill development"""

        super().__init__(
            name="Mentor",
            system_prompt=system_prompt,
            llm_config=llm_config,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=15,
        )

        # Register agent-specific tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register tools specific to the Mentor agent."""
        self.register_tool(self.create_study_plan, name="create_study_plan")
        self.register_tool(self.assess_understanding, name="assess_understanding")
        self.register_tool(self.generate_practice_questions, name="generate_practice_questions")

    def create_study_plan(
        self,
        topic: str,
        duration_days: int,
        level: str = "beginner",
        hours_per_day: int = 2,
    ) -> Dict[str, Any]:
        """
        Create a structured study plan for a topic.

        Args:
            topic: Subject or skill to learn
            duration_days: Number of days for the plan
            level: Learner's current level (beginner/intermediate/advanced)
            hours_per_day: Daily study hours

        Returns:
            Study plan dictionary
        """
        return {
            "topic": topic,
            "duration_days": duration_days,
            "level": level,
            "hours_per_day": hours_per_day,
            "phases": [
                {"phase": 1, "focus": "Foundation", "days": duration_days // 3},
                {"phase": 2, "focus": "Practice", "days": duration_days // 3},
                {"phase": 3, "focus": "Mastery", "days": duration_days - 2 * (duration_days // 3)},
            ],
        }

    def assess_understanding(
        self,
        topic: str,
        user_response: str,
        expected_concepts: list,
    ) -> Dict[str, Any]:
        """
        Assess a learner's understanding of a topic.

        Args:
            topic: The topic being assessed
            user_response: The learner's answer/explanation
            expected_concepts: Key concepts that should be mentioned

        Returns:
            Assessment results with feedback
        """
        return {
            "topic": topic,
            "concepts_identified": [],
            "concepts_missing": expected_concepts,
            "understanding_level": "needs_review",
            "feedback": "Please review the key concepts and try again.",
        }

    def generate_practice_questions(
        self,
        topic: str,
        num_questions: int = 5,
        difficulty: str = "medium",
        question_type: str = "multiple_choice",
    ) -> Dict[str, Any]:
        """
        Generate practice questions for a topic.

        Args:
            topic: Subject matter for questions
            num_questions: Number of questions to generate
            difficulty: Question difficulty (easy/medium/hard)
            question_type: Type of questions (multiple_choice/open_ended/problem)

        Returns:
            Dictionary containing practice questions
        """
        return {
            "topic": topic,
            "num_questions": num_questions,
            "difficulty": difficulty,
            "question_type": question_type,
            "questions": [],
        }
