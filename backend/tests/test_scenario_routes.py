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
    assert response.json() == {"message": "Welcome to CyberGuard AI API"}

def test_org_rag_retrieval_policies():
    retriever = OrganizationalRetriever()
    results = retriever.retrieve_context("Finance Manager", query="wire transfer", top_k=2)
    assert len(results) >= 1
    assert "FIN-SEC" in results[0]["content"] or "Wire" in results[0]["content"]

    context_str = get_org_context("Finance Manager")
    assert len(context_str) > 20
    assert "FIN-SEC-04" in context_str

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
