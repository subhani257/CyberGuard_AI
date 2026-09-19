import asyncio

import pytest
from fastapi import HTTPException

from api import evaluation_routes
from runtime_store import get_decision


def test_evaluation_does_not_claim_success_when_database_write_fails(monkeypatch):
    class BrokenDatabase:
        def table(self, _):
            return self

        def insert(self, _):
            return self

        def execute(self):
            raise RuntimeError("database unavailable")

    monkeypatch.setattr(evaluation_routes, "supabase", BrokenDatabase())
    scenario_id = "88888888-8888-8888-8888-888888888888"
    user_id = "99999999-9999-9999-9999-999999999999"

    with pytest.raises(HTTPException) as error:
        asyncio.run(evaluation_routes._save_evaluation_to_database(
            scenario_id=scenario_id,
            user_id=user_id,
            user_action="Verify independently",
            user_reasoning="The request is unexpected",
            evaluation_result={"final_score": 80, "is_safe": True},
            threat_analysis={
                "indicators": {}, "safe_behavior": {}, "threat_knowledge": {},
                "reasoning_classification": {}, "human_review_required": False,
                "agent_trace": [],
            },
            channel="email",
        ))

    assert error.value.status_code == 503
    assert get_decision(scenario_id, user_id) is None
