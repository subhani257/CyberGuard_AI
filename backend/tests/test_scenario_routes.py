import pytest
from fastapi.testclient import TestClient
from main import app
from rag.retrieval import OrganizationalRetriever, get_org_context
from nlp.ner import sanitize_input, extract_entities
from agents.scenario_agent import ScenarioAgent

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Midnight Intelligence API"}

def test_org_rag_retrieval_policies():
    retriever = OrganizationalRetriever()
    results = retriever.retrieve_context("Finance Manager", query="wire transfer", top_k=2)
    assert len(results) >= 1
    assert "FIN-SEC" in results[0]["content"] or "Wire" in results[0]["content"]

    context_str = get_org_context("Finance Manager")
    assert len(context_str) > 20
    assert "FIN-SEC" in context_str or "Wire" in context_str or "Finance" in context_str


def test_ner_pii_sanitization():
    raw_text = "Please send $50,000 to John Doe at john.doe@partner-firm.com or call 555-019-2834."
    sanitized = sanitize_input(raw_text)
    assert "john.doe@partner-firm.com" not in sanitized
    assert "[MASKED_EMAIL]" in sanitized
    assert "[MASKED_FINANCIAL]" in sanitized or "[MASKED_PHONE]" in sanitized

    entities = extract_entities(raw_text)
    assert len(entities["emails"]) > 0

def test_scenario_agent_structure():
    agent = ScenarioAgent()
    scenario = agent.generate(role="Finance Manager", difficulty="medium", org_context="FIN-SEC-04: Dual authorization required.")
    assert "sender_name" in scenario
    assert "sender_email" in scenario
    assert "subject" in scenario
    assert "body" in scenario
    assert "choices" in scenario
    assert len(scenario["choices"]) >= 3

def test_api_generate_scenario_and_fetch():
    payload = {
        "user_id": "11111111-1111-1111-1111-111111111111",
        "role": "Finance Manager",
        "difficulty": "medium"
    }
    response = client.post("/api/generate-scenario", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "scenario_id" in data
    assert "scenario" in data
    scenario_id = data["scenario_id"]

    # Fetch back by scenario_id
    fetch_resp = client.get(f"/api/scenarios/{scenario_id}")
    assert fetch_resp.status_code == 200
    fetch_data = fetch_resp.json()
    assert fetch_data["status"] == "success"

def test_channel_specific_scenario_generation():
    agent = ScenarioAgent()
    for ch in ["voice_phone", "slack_teams", "qr_code", "cloud_oauth", "sms_push", "physical_media"]:
        sc = agent.generate(role="DevOps Engineer", difficulty="hard", channel=ch)
        assert sc["channel"] == ch
        assert "channel_data" in sc
        assert isinstance(sc["channel_data"], dict)
        assert len(sc["choices"]) == 4

    # Test via API endpoint
    response = client.post("/api/generate-scenario", json={
        "user_id": "11111111-1111-1111-1111-111111111111",
        "role": "Security Analyst",
        "difficulty": "medium",
        "channel": "voice_phone"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["scenario"]["channel"] == "voice_phone"
    assert "caller_id" in data["scenario"]["channel_data"]
