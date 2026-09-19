"""
CyberGuard AI -- LangGraph StateGraph Assembly

Wires the three agent nodes into a directed graph with:
  - Conditional routing after evaluation (coach vs. human_review pause)
  - MemorySaver checkpointer so state persists across API calls within a session
  - LangSmith tracing enabled via LANGCHAIN_TRACING_V2 env var
"""
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from graph.state import CyberGuardState
from graph.nodes.scenario_node import scenario_node
from graph.nodes.evaluation_node import evaluation_node
from graph.nodes.coach_node import coach_node


# Routing function

def route_after_evaluation(state: CyberGuardState) -> str:
    """
    After the evaluation node, decide whether to:
    - pause and surface to the Admin review queue (human_review_required=True)
    - proceed straight to coaching feedback (normal happy path)
    """
    if state.get("human_review_required"):
        return "human_review"
    return "coach"


# Scenario sub-graph (Scenario Node only)

def build_scenario_graph():
    """
    Lightweight graph used by /api/generate-scenario.
    Only the scenario_node runs; state is checkpointed for later evaluation.
    """
    builder = StateGraph(CyberGuardState)
    builder.add_node("scenario", scenario_node)
    builder.set_entry_point("scenario")
    builder.add_edge("scenario", END)
    return builder.compile(checkpointer=MemorySaver())


# Evaluation + Coach sub-graph

def build_evaluation_graph():
    """
    Graph used by /api/agents/evaluate. Coaching is invoked later by
    /api/coach/process-decision after the evaluation has been persisted.
    """
    builder = StateGraph(CyberGuardState)
    builder.add_node("evaluation", evaluation_node)
    builder.set_entry_point("evaluation")
    builder.add_edge("evaluation", END)

    return builder.compile(checkpointer=MemorySaver())


# Coach sub-graph (Coach Node only)

def build_coach_graph():
    """
    Lightweight graph used by /api/coach/process-decision.
    Only the coach_node runs.
    """
    builder = StateGraph(CyberGuardState)
    builder.add_node("coach", coach_node)
    builder.set_entry_point("coach")
    builder.add_edge("coach", END)
    return builder.compile(checkpointer=MemorySaver())


# Full end-to-end graph (for testing / LangGraph Studio)

def build_full_graph():
    """
    Complete graph: scenario -> evaluation -> coach.
    Used in tests and LangGraph Studio for visual inspection.
    """
    builder = StateGraph(CyberGuardState)
    builder.add_node("scenario", scenario_node)
    builder.add_node("evaluation", evaluation_node)
    builder.add_node("coach", coach_node)

    builder.set_entry_point("scenario")
    builder.add_edge("scenario", "evaluation")
    builder.add_conditional_edges(
        "evaluation",
        route_after_evaluation,
        {
            "human_review": END,
            "coach": "coach",
        },
    )
    builder.add_edge("coach", END)

    return builder.compile(checkpointer=MemorySaver())


# Singleton instances used by the API routes
scenario_graph = build_scenario_graph()
evaluation_graph = build_evaluation_graph()
coach_graph = build_coach_graph()
full_graph = build_full_graph()
