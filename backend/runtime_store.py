"""Process-local persistence used only when Supabase is unavailable.

The store keeps the same ownership boundaries as the database so the offline
assignment demo exercises the real workflow instead of unrelated fixtures.
"""

from typing import Any, Dict, Optional
from datetime import datetime, timezone
import uuid


SCENARIOS: Dict[str, Dict[str, Any]] = {}
DECISIONS: Dict[str, Dict[str, Any]] = {}
LEARNING_PROFILES: Dict[str, Dict[str, Any]] = {}


def save_scenario(scenario_id: str, user_id: str, content: Dict[str, Any]) -> None:
    SCENARIOS[scenario_id] = {
        "id": scenario_id,
        "user_id": user_id,
        "content": content,
    }


def get_scenario(scenario_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    scenario = SCENARIOS.get(scenario_id)
    if scenario and (scenario.get("user_id") == user_id or not user_id):
        return scenario
    return None


def save_decision(scenario_id: str, user_id: str, decision: Dict[str, Any]) -> None:
    DECISIONS[f"{user_id}:{scenario_id}"] = {
        **decision,
        "id": decision.get("id") or str(uuid.uuid4()),
        "created_at": decision.get("created_at") or datetime.now(timezone.utc).isoformat(),
    }


def get_decision(scenario_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    return DECISIONS.get(f"{user_id}:{scenario_id}")
