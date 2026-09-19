"""Assignment-critical checks for ownership and an exact scenario handoff."""

from fastapi.testclient import TestClient

from main import app
from runtime_store import get_decision


client = TestClient(app)


def test_unknown_scenario_is_never_replaced_with_demo_fixture(learner_headers):
    response = client.post(
        "/api/agents/evaluate",
        json={
            "scenario_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "user_action": "Verify through official channels",
            "user_reasoning": "I will independently verify the sender."
        },
        headers=learner_headers
    )
    assert response.status_code == 404


def test_cross_user_evaluation_is_blocked(learner_headers, other_learner_headers):
    scenario = client.post(
        "/api/generate-scenario",
        json={"channel": "email"},
        headers=learner_headers
    ).json()
    response = client.post(
        "/api/agents/evaluate",
        json={
            "scenario_id": scenario["scenario_id"],
            "user_action": scenario["scenario"]["choices"][0],
            "user_reasoning": "I think this request is safe."
        },
        headers=other_learner_headers
    )
    assert response.status_code == 404


def test_action_must_be_one_of_the_generated_choices(learner_headers):
    scenario = client.post(
        "/api/generate-scenario",
        json={"channel": "email"},
        headers=learner_headers
    ).json()
    response = client.post(
        "/api/agents/evaluate",
        json={
            "scenario_id": scenario["scenario_id"],
            "user_action": "A choice I invented in a request",
            "user_reasoning": "I would verify using a second channel."
        },
        headers=learner_headers
    )
    assert response.status_code == 422


def test_coach_uses_stored_evaluation_not_forged_browser_score(learner_headers):
    generated = client.post(
        "/api/generate-scenario",
        json={"channel": "email"},
        headers=learner_headers
    ).json()
    scenario_id = generated["scenario_id"]
    choice = next(
        choice for choice in generated["scenario"]["choices"]
        if any(word in choice.lower() for word in ["send", "transfer", "approve", "click", "comply"])
    )
    evaluated = client.post(
        "/api/agents/evaluate",
        json={
            "scenario_id": scenario_id,
            "user_action": choice,
            "user_reasoning": "My boss asked urgently, so I trusted the request."
        },
        headers=learner_headers
    )
    assert evaluated.status_code == 200
    saved = get_decision(scenario_id, "11111111-1111-1111-1111-111111111111")
    assert saved is not None
    assert saved["evaluation"]["final_score"] != 100

    coached = client.post(
        "/api/coach/process-decision",
        json={"scenario_id": scenario_id, "score": 100, "weaknesses": ["forged"]},
        headers=learner_headers
    )
    assert coached.status_code == 200
    assert str(saved["evaluation"]["final_score"]) in coached.json()["coaching"]["reason_for_path"]


def test_learner_data_routes_require_authentication():
    assert client.get("/api/coach/dashboard-summary").status_code == 401
    assert client.post("/api/coach/onboard-user", json={"job_title": "Finance Manager"}).status_code == 401
