"""
CyberGuard AI — LangGraph Shared State
The single TypedDict that flows through all graph nodes.
Each API call (scenario, evaluation, coach) reads/writes fields here.
"""
from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class CyberGuardState(TypedDict, total=False):
    # -- User context (set at graph entry) ------------------------------------
    user_id: str
    role: str
    difficulty: str
    channel: Optional[str]          # e.g. 'email', 'voice_phone', 'slack_teams'
    topic: Optional[str]
    company: Optional[str]

    # -- Scenario generation phase ---------------------------------------------
    org_context: str                # Retrieved from pgvector + sanitized by spaCy
    scenario: Dict[str, Any]        # Generated scenario JSON
    scenario_id: str                # UUID assigned after DB persist

    # -- Evaluation phase (set when user submits an answer) --------------------
    user_action: str
    user_reasoning: str
    scenario_content: Dict[str, Any]  # Fetched scenario content for analysis

    # NLP / RAG intermediate results
    threat_indicators: Dict[str, Any]
    safe_behavior: Dict[str, Any]
    threat_knowledge: Dict[str, Any]
    reasoning_classification: Dict[str, Any]

    # Evaluation outcome
    evaluation_result: Dict[str, Any]
    human_review_required: bool     # True ? graph pauses for Admin review

    # -- Coaching phase --------------------------------------------------------
    past_decisions: List[Dict[str, Any]]
    current_difficulty: str
    coaching_result: Dict[str, Any]

    # -- Admin observability ---------------------------------------------------
    agent_trace: List[Dict[str, Any]]  # Per-node timing/token records

    # -- Error handling --------------------------------------------------------
    error: Optional[str]
