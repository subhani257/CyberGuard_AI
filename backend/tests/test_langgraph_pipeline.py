import pytest
from fastapi.testclient import TestClient
from main import app
from graph.cyberguard_graph import scenario_graph, evaluation_graph, coach_graph, full_graph
from security.auth_bearer import create_access_token

client = TestClient(app)

def test_graphs_structure_and_compilation():
    """Verify all LangGraph subgraphs compile with valid node topologies."""
    assert "scenario" in scenario_graph.get_graph().nodes
    assert "evaluation" in evaluation_graph.get_graph().nodes
    assert "coach" in coach_graph.get_graph().nodes

    full_nodes = full_graph.get_graph().nodes
    assert "scenario" in full_nodes
    assert "evaluation" in full_nodes
    assert "coach" in full_nodes


def test_scenario_graph_execution():
    """Verify scenario_graph generates valid structure and traces."""
    state = scenario_graph.invoke(
        {
            "user_id": "test-user-langgraph",
            "role": "Security Engineer",
            "difficulty": "beginner",
            "channel": "email",
            "topic": "Credential Phishing",
            "org_context": "Always verify URLs and certificates before entering credentials.",
            "agent_trace": [],
        },
        config={"configurable": {"thread_id": "test-thread-scen"}},
    )
    assert "scenario" in state
    scenario = state["scenario"]
    assert "situation_title" in scenario
    assert "choices" in scenario
    assert len(scenario["choices"]) >= 2
    assert "agent_trace" in state
    assert any(t["node"] == "scenario_node" for t in state["agent_trace"])


def test_evaluation_graph_execution():
    """Verify evaluation_graph scores the response and extracts indicators."""
    mock_scenario = {
        "situation_title": "Fake IT Password Reset",
        "sender_name": "Helpdesk",
        "sender_email": "support@internal-portal.xyz",
        "subject": "Urgent: Reset password now",
        "body": "Your credentials expire in 10 minutes. Click the link to reset immediately.",
        "choices": [
            "Click the link immediately",
            "Report to IT Security and do not click"
        ],
        "channel": "email",
        "clues_embedded": ["external domain", "urgent deadline"]
    }
    state = evaluation_graph.invoke(
        {
            "user_id": "test-user-langgraph",
            "scenario_content": mock_scenario,
            "user_action": "Report to IT Security and do not click",
            "user_reasoning": "This is a suspicious phishing attempt with a fake domain and false urgency. I will verify and report it to IT security.",
            "agent_trace": [],
        },
        config={"configurable": {"thread_id": "test-thread-eval"}},
    )
    assert "evaluation_result" in state
    eval_res = state["evaluation_result"]
    assert "final_score" in eval_res
    assert eval_res["final_score"] >= 60
    assert eval_res["is_safe"] is True
    assert "human_review_required" in state
    assert any(t["node"] == "evaluation_node" for t in state["agent_trace"])


def test_coach_graph_execution():
    """Verify coach_graph calculates adaptive progression and guidance."""
    state = coach_graph.invoke(
        {
            "user_id": "test-user-langgraph",
            "evaluation_result": {
                "final_score": 85,
                "is_safe": True,
                "threat_indicators": ["urgency_indicators"],
                "weaknesses": ["urgency_bias"]
            },
            "past_decisions": [],
            "current_difficulty": "beginner",
            "agent_trace": [],
        },
        config={"configurable": {"thread_id": "test-thread-coach"}},
    )
    assert "coaching_result" in state
    coach_res = state["coaching_result"]
    assert "feedback" in coach_res
    assert "next_difficulty" in coach_res
    assert "nist_reference" in coach_res
    assert any(t["node"] == "coach_node" for t in state["agent_trace"])


def test_admin_routes_access_control():
    """Verify non-admin users cannot access admin governance console endpoints."""
    learner_token = create_access_token({"id": "learner-1", "email": "learner@test.com", "access_role": "learner"})
    admin_token = create_access_token({"id": "admin-1", "email": "admin@test.com", "access_role": "admin"})

    # Learner rejected with 403
    r_learner = client.get("/api/admin/pending-reviews", headers={"Authorization": f"Bearer {learner_token}"})
    assert r_learner.status_code == 403

    # Admin accepted with 200
    r_admin = client.get("/api/admin/pending-reviews", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_admin.status_code == 200
    assert "cases" in r_admin.json()

    # Admin performance endpoint
    r_perf = client.get("/api/admin/performance", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_perf.status_code == 200
    assert "metrics" in r_perf.json()