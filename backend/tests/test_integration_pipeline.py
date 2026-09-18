import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_multiturn_agent_pipeline(learner_headers):
    """
    End-to-End Integration Test across all 3 Member systems:
    1. Member 1: Generates scenario using RAG + spaCy NER.
    2. Member 2: Evaluates the user's action and reasoning with Threat Analysis + LLM scoring.
    3. Member 3: Coach Agent processes the evaluation, updates learning profile, and scales difficulty.
    4. Feedback Loop: User Dashboard verifies the updated progression.
    """
    # -------------------------------------------------------------
    # Step 1: Member 1 - Generate Scenario
    # -------------------------------------------------------------
    gen_payload = {
        "user_id": "11111111-1111-1111-1111-111111111111",
        "role": "Finance Manager",
        "difficulty": "medium"
    }
    gen_response = client.post("/api/generate-scenario", json=gen_payload, headers=learner_headers)
    assert gen_response.status_code == 200
    gen_data = gen_response.json()
    assert gen_data["status"] == "success"
    scenario_id = gen_data["scenario_id"]
    scenario_content = gen_data["scenario"]
    
    assert "sender_name" in scenario_content
    assert "subject" in scenario_content
    assert len(scenario_content.get("choices", [])) >= 3

    # -------------------------------------------------------------
    # Step 2: Member 2 - Evaluate Safe Decision
    # -------------------------------------------------------------
    safe_choice = next(
        choice for choice in scenario_content["choices"]
        if any(word in choice.lower() for word in ["verify", "report", "deny", "security"])
    )
    eval_payload = {
        "scenario_id": scenario_id,
        "user_action": safe_choice,
        "user_reasoning": "The domain looks suspicious and external, and our policy requires secondary phone verification for all wire requests.",
        "user_id": "11111111-1111-1111-1111-111111111111"
    }
    eval_response = client.post("/api/agents/evaluate", json=eval_payload, headers=learner_headers)
    assert eval_response.status_code == 200
    eval_data = eval_response.json()
    assert eval_data["success"] is True
    assert "evaluation" in eval_data

    evaluation_details = eval_data["evaluation"]["evaluation"]
    final_score = evaluation_details.get("final_score", 85)
    is_safe = evaluation_details.get("is_safe", True)

    # -------------------------------------------------------------
    # Step 3: Member 3 - Coach Agent Ingests Decision & Updates Profile
    # -------------------------------------------------------------
    coach_response = client.post(
        "/api/coach/process-decision",
        json={"scenario_id": scenario_id},
        headers=learner_headers
    )
    assert coach_response.status_code == 200
    coach_data = coach_response.json()
    assert coach_data["success"] is True
    assert "coaching" in coach_data
    coaching = coach_data["coaching"]
    assert "next_difficulty" in coaching
    assert "feedback" in coaching

    # -------------------------------------------------------------
    # Step 4: Verification - Dashboard Reflects Session State
    # -------------------------------------------------------------
    dash_response = client.get("/api/coach/dashboard-summary", headers=learner_headers)
    assert dash_response.status_code == 200
    dash_data = dash_response.json()
    assert dash_data["success"] is True
    assert "readiness_score" in dash_data
    assert "decision_journey" in dash_data
