"""
数据分析师 (Analyst) Agent.
Handles data analysis, insights generation, and statistical reasoning.
"""

from typing import Any, Dict, List, Optional, Union
from .base import BaseAgent


class AnalystAgent(BaseAgent):
    """
    数据分析师 - Data analysis and insights agent.

    Responsibilities:
    - Analyze data and extract insights
    - Generate reports and visualizations
    - Perform statistical analysis
    - Identify trends and patterns
    - Provide data-driven recommendations
    """

    def __init__(
        self,
        llm_config: Optional[Dict[str, Any]] = None,
    ):
        system_prompt = """You are 数据分析师 (Data Analyst), a skilled data science professional.

Your role:
1. Analyze datasets to extract meaningful insights
2. Identify trends, patterns, and anomalies in data
3. Create clear, actionable reports from complex data
4. Recommend appropriate statistical methods and visualizations
5. Translate technical findings into business recommendations
6. Validate data quality and identify potential issues
7. Support data-driven decision making

Communication style:
- Precise and methodical
- Data-focused with clear evidence
- Explain statistical concepts accessibly
- Highlight key findings prominently
- Acknowledge limitations and uncertainties

You specialize in:
- Exploratory data analysis (EDA)
- Statistical analysis and hypothesis testing
- Data visualization best practices
- SQL and data querying
- Business intelligence and KPIs
- Predictive analytics fundamentals"""

        super().__init__(
            name="Analyst",
            system_prompt=system_prompt,
            llm_config=llm_config,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=15,
        )

        # Register agent-specific tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register tools specific to the Analyst agent."""
        self.register_tool(self.summarize_data, name="summarize_data")
        self.register_tool(self.identify_trends, name="identify_trends")
        self.register_tool(self.generate_insights, name="generate_insights")
        self.register_tool(self.suggest_visualizations, name="suggest_visualizations")

    def summarize_data(
        self,
        data_description: str,
        metrics: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate summary statistics for a dataset.

        Args:
            data_description: Description of the dataset
            metrics: Specific metrics to calculate

        Returns:
            Summary statistics dictionary
        """
        default_metrics = ["count", "mean", "median", "std", "min", "max"]
        requested_metrics = metrics or default_metrics

        return {
            "dataset": data_description[:100] + "..." if len(data_description) > 100 else data_description,
            "metrics": requested_metrics,
            "summary": {
                "total_records": 0,
                "complete_records": 0,
                "data_quality": "pending_analysis",
            },
            "note": "Mock response - connect to actual data source for real analysis",
        }

    def identify_trends(
        self,
        data_context: str,
        time_period: Optional[str] = None,
        metric: str = "value",
    ) -> Dict[str, Any]:
        """
        Identify trends in data over time.

        Args:
            data_context: Context about the data being analyzed
            time_period: Time range for trend analysis
            metric: The metric to analyze for trends

        Returns:
            Trend analysis results
        """
        return {
            "context": data_context[:100] + "..." if len(data_context) > 100 else data_context,
            "time_period": time_period or "last_30_days",
            "metric": metric,
            "trends": {
                "direction": "stable",
                "magnitude": "low",
                "confidence": 0.0,
                "seasonality": "undetected",
            },
            "insights": [],
            "note": "Mock response - connect to actual data source for real analysis",
        }

    def generate_insights(
        self,
        analysis_results: Dict[str, Any],
        business_context: str,
    ) -> List[Dict[str, Any]]:
        """
        Generate actionable insights from analysis results.

        Args:
            analysis_results: Results from data analysis
            business_context: Business context for interpretation

        Returns:
            List of actionable insights with recommendations
        """
        return [
            {
                "insight": "Pending actual data analysis",
                "category": "general",
                "impact": "unknown",
                "confidence": "low",
                "recommendation": "Connect to data source for meaningful insights",
                "supporting_data": [],
            }
        ]

    def suggest_visualizations(
        self,
        data_type: str,
        message: str = "Show key findings",
        audience: str = "executive",
    ) -> List[Dict[str, str]]:
        """
        Suggest appropriate visualizations for data.

        Args:
            data_type: Type of data (time_series, categorical, distribution, etc.)
            message: Key message to communicate
            audience: Target audience (executive, technical, general)

        Returns:
            List of visualization suggestions
        """
        visualization_map = {
            "time_series": [
                {"type": "line_chart", "purpose": "Show trends over time"},
                {"type": "area_chart", "purpose": "Show cumulative values"},
                {"type": "heatmap", "purpose": "Show patterns by period"},
            ],
            "categorical": [
                {"type": "bar_chart", "purpose": "Compare categories"},
                {"type": "pie_chart", "purpose": "Show proportions"},
                {"type": "treemap", "purpose": "Show hierarchical data"},
            ],
            "distribution": [
                {"type": "histogram", "purpose": "Show value distribution"},
                {"type": "box_plot", "purpose": "Show statistical spread"},
                {"type": "violin_plot", "purpose": "Show density distribution"},
            ],
            "correlation": [
                {"type": "scatter_plot", "purpose": "Show relationships"},
                {"type": "correlation_matrix", "purpose": "Show correlation heatmap"},
                {"type": "bubble_chart", "purpose": "Show multi-variable relationships"},
            ],
        }

        suggestions = visualization_map.get(data_type, visualization_map["categorical"])

        # Adjust complexity based on audience
        if audience == "executive":
            suggestions = [s for s in suggestions if s["type"] in ["bar_chart", "line_chart", "pie_chart"]]

        return suggestions
