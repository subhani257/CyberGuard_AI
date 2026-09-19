from fastapi.testclient import TestClient

from main import app
from runtime_store import save_decision, save_scenario
from security.auth_bearer import create_access_token


client = TestClient(app)


def _headers(user_id):
    return {"Authorization": "Bearer " + create_access_token({
        "sub": user_id,
        "email": "history@example.test",
        "access_role": "learner",
        "role": "Employee",
        "company": "Example",
    })}


def test_completed_scenarios_show_owned_titles_scores_and_pages():
    owner = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    other = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    old_id = "10000000-0000-0000-0000-000000000001"
    new_id = "10000000-0000-0000-0000-000000000002"
    private_id = "10000000-0000-0000-0000-000000000003"
    for scenario_id, user_id, title, score, when in (
        (old_id, owner, "Invoice verification", 72, "2026-01-01T10:00:00+00:00"),
        (new_id, owner, "Unexpected MFA prompt", 91, "2026-01-02T10:00:00+00:00"),
        (private_id, other, "Private scenario", 12, "2026-01-03T10:00:00+00:00"),
    ):
        save_scenario(scenario_id, user_id, {
            "situation_title": title, "channel": "email",
            "body": "A suspicious request arrived.",
            "choices": ["Verify", "Approve"],
        })
        save_decision(scenario_id, user_id, {
            "user_id": user_id, "scenario_id": scenario_id,
            "chosen_action": "Verify", "reasoning": "I checked the sender.",
            "evaluation": {"final_score": score}, "is_safe": score > 80,
            "created_at": when,
        })

    first = client.get("/api/coach/completed-scenarios?limit=1", headers=_headers(owner))
    assert first.status_code == 200
    assert first.json()["total"] == 2
    assert first.json()["has_more"] is True
    assert first.json()["items"][0]["title"] == "Unexpected MFA prompt"
    assert first.json()["items"][0]["score"] == 91

    second = client.get("/api/coach/completed-scenarios?limit=1&offset=1", headers=_headers(owner))
    assert second.status_code == 200
    assert second.json()["has_more"] is False
    assert second.json()["items"][0]["title"] == "Invoice verification"
    assert second.json()["items"][0]["score"] == 72
    assert all(item["title"] != "Private scenario" for item in first.json()["items"] + second.json()["items"])

    decision_id = first.json()["items"][0]["id"]
    detail = client.get(f"/api/coach/completed-scenarios/{decision_id}", headers=_headers(owner))
    assert detail.status_code == 200
    assert detail.json()["scenario"]["body"] == "A suspicious request arrived."
    assert detail.json()["scenario"]["choices"] == ["Verify", "Approve"]
    assert detail.json()["decision"]["chosen_action"] == "Verify"
    assert detail.json()["evaluation"]["final_score"] == 91
    assert client.get(f"/api/coach/completed-scenarios/{decision_id}", headers=_headers(other)).status_code == 404


def test_completed_scenarios_require_authentication():
    assert client.get("/api/coach/completed-scenarios").status_code == 401
    assert client.get("/api/coach/completed-scenarios/unknown").status_code == 401


def test_sector_history_filters_all_decisions_and_matches_average_score():
    owner = "cccccccc-cccc-cccc-cccc-cccccccccccc"
    other = "dddddddd-dddd-dddd-dddd-dddddddddddd"
    for index, (user_id, channel, score) in enumerate((
        (owner, "email", 67),
        (owner, "email", 93),
        (owner, "voice_phone", 41),
        (other, "email", 5),
    )):
        scenario_id = f"20000000-0000-0000-0000-{index + 1:012d}"
        save_scenario(scenario_id, user_id, {
            "situation_title": f"Scenario {index}", "channel": channel,
        })
        save_decision(scenario_id, user_id, {
            "user_id": user_id, "scenario_id": scenario_id,
            "chosen_action": "Verify", "reasoning": "Checked independently",
            "evaluation": {"final_score": score}, "is_safe": score >= 80,
            "created_at": f"2026-01-0{index + 1}T10:00:00+00:00",
        })

    email = client.get("/api/coach/completed-scenarios?channel=email&limit=1", headers=_headers(owner))
    assert email.status_code == 200
    assert email.json()["total"] == 2
    assert email.json()["average_score"] == 80
    assert email.json()["has_more"] is True
    assert email.json()["items"][0]["title"] == "Scenario 1"

    email_second = client.get("/api/coach/completed-scenarios?channel=email&limit=1&offset=1", headers=_headers(owner))
    assert email_second.json()["total"] == 2
    assert email_second.json()["average_score"] == 80
    assert email_second.json()["items"][0]["title"] == "Scenario 0"

    voice = client.get("/api/coach/completed-scenarios?channel=voice_phone", headers=_headers(owner))
    assert voice.json()["total"] == 1
    assert voice.json()["average_score"] == 41
    assert voice.json()["items"][0]["channel"] == "voice_phone"
