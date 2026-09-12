import pytest
from fastapi.testclient import TestClient
from main import app
from agents.coach_agent import TrainingCoachAgent
from rag.training_retrieval import TrainingRetriever
from nlp.summarizer import WeaknessSummarizer

client = TestClient(app)

def test_training_retrieval_nist_guidance():
    retriever = TrainingRetriever()
    results = retriever.retrieve_guidance(["urgency_bias"], top_k=1)
    assert len(results) >= 1
    assert "NIST" in results[0]["source"] or "SANS" in results[0]["source"]
    assert "content" in results[0]
    assert len(results[0]["content"]) > 20

def test_nlp_weakness_summarizer():
    summarizer = WeaknessSummarizer()
    mock_history = [
        {
            "scenario_id": "SC-1",
            "is_safe": False,
            "reasoning": "I transferred the wire because the CEO sent an urgent email demanding immediate payment.",
            "evaluation": {"final_score": 35, "weaknesses": ["urgency_bias", "authority_abuse"]}
        },
        {
            "scenario_id": "SC-2",
            "is_safe": False,
            "reasoning": "The deadline was 10 minutes so I quickly approved the vendor invoice without checking.",
            "evaluation": {"final_score": 40, "weaknesses": ["urgency_bias"]}
        },
        {
            "scenario_id": "SC-3",
            "is_safe": True,
            "reasoning": "I inspected the domain header and spotted typosquatting, so I reported the email.",
            "evaluation": {"final_score": 90, "weaknesses": []}
        }
    ]
    summary_data = summarizer.summarize_user_tendencies(mock_history)
    assert summary_data["total_scenarios_analyzed"] == 3
    assert summary_data["dominant_weakness"] == "urgency_bias"
    assert "urgency" in summary_data["summary_text"].lower() or "authority" in summary_data["summary_text"].lower()
    assert summary_data["overall_accuracy_rate"] == 33

def test_coach_agent_difficulty_progression():
    agent = TrainingCoachAgent()
    
    # Consistent high scores should elevate difficulty
    elevated = agent.calculate_next_difficulty(
        current_difficulty="beginner",
        recent_scores=[85, 90, 88]
    )
    assert elevated == "medium"

    # Consecutive mastery should reach advanced
    elevated_adv = agent.calculate_next_difficulty(
        current_difficulty="medium",
        recent_scores=[92, 85, 88]
    )
    assert elevated_adv == "advanced"

    # Low score should drop difficulty
    dropped = agent.calculate_next_difficulty(
        current_difficulty="medium",
        recent_scores=[30]
    )
    assert dropped == "beginner"

def test_coach_agent_generate_coaching_structure():
    agent = TrainingCoachAgent()
    evaluation = {
        "final_score": 42,
        "is_safe": False,
        "weaknesses": ["urgency_bias", "authority_abuse"],
        "threat_indicators": ["urgent", "wire_transfer"]
    }
    
    plan = agent.generate_coaching(
        user_id="test-user-1",
        evaluation_data=evaluation,
        current_difficulty="medium"
    )
    
    assert "feedback" in plan
    assert "remediation_tip" in plan
    assert "recommended_topic" in plan
    assert "next_difficulty" in plan
    assert "nist_reference" in plan
    assert plan["next_difficulty"] in ["beginner", "medium", "advanced"]

def test_api_coach_process_decision():
    payload = {
        "scenario_id": "SC-TEST-99",
        "score": 45,
        "threat_type": "phishing",
        "weaknesses": ["urgency_bias"],
        "is_safe": False,
        "chosen_action": "Clicked the link",
        "reasoning": "I thought it was from my manager.",
        "user_id": "11111111-1111-1111-1111-111111111111"
    }
    response = client.post("/api/coach/process-decision", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "coaching" in data
    assert "remediation_tip" in data["coaching"]

def test_api_coach_dashboard_summary():
    response = client.get("/api/coach/dashboard-summary?user_id=11111111-1111-1111-1111-111111111111")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "readiness_score" in data
    assert "feedback_headline" in data
    assert "next_situation" in data
    assert "channel" in data["next_situation"]
    assert "decision_journey" in data
    assert "weakness_breakdown" in data
    assert "Phishing & Spoofing" in data["weakness_breakdown"]

def test_dynamic_role_analysis_without_hardcoding():
    agent = TrainingCoachAgent()
    
    # 1. Test Healthcare / Medical Role
    nurse_profile = agent.analyze_first_time_user(
        job_title="Hospital Radiologist / ICU Nurse",
        department="Emergency Care Unit",
        org_name="Metro Health General",
        org_description="Regional hospital handling confidential patient health records (PHI) and emergency telemetry."
    )
    assert nurse_profile["next_difficulty"] == "beginner"
    assert "target_channel" in nurse_profile
    assert len(nurse_profile["primary_attack_surface"]) > 10
    assert "nist_reference" in nurse_profile
    assert nurse_profile["target_channel"] in ["voice_phone", "email", "slack_teams", "qr_code", "cloud_oauth", "sms_push", "physical_media"]

    # 2. Test Cloud / DevOps Role
    devops_profile = agent.analyze_first_time_user(
        job_title="Lead Infrastructure & DevOps Engineer",
        department="Platform Cloud Engineering",
        org_name="SaaS Scale Labs",
        org_description="Fintech software platform managing AWS Kubernetes clusters, CI/CD pipelines, and secrets."
    )
    assert devops_profile["next_difficulty"] == "beginner"
    assert "target_channel" in devops_profile
    assert "cloud" in devops_profile["primary_attack_surface"].lower() or "secret" in devops_profile["primary_attack_surface"].lower() or "infrastructure" in devops_profile["primary_attack_surface"].lower() or "credential" in devops_profile["primary_attack_surface"].lower()

    # 3. Test Logistics / Supply Chain Role
    logistics_profile = agent.analyze_first_time_user(
        job_title="Logistics Fleet Dispatcher",
        department="Supply Chain & Freight Operations",
        org_name="Global Freight Express"
    )
    assert logistics_profile["next_difficulty"] == "beginner"
    assert "target_channel" in logistics_profile
    assert len(logistics_profile["next_focus"]) > 5

def test_multi_channel_training_retrieval():
    retriever = TrainingRetriever()
    
    # Voice / Vishing
    vishing_results = retriever.retrieve_guidance(["vishing_defense", "voice_phone"], top_k=1)
    assert len(vishing_results) >= 1
    assert any(k in vishing_results[0].get("content", "").lower() or k in vishing_results[0].get("category", "").lower() or k in vishing_results[0].get("channel", "").lower() for k in ["voice", "phone", "vishing"])

    # Slack / Teams
    chat_results = retriever.retrieve_guidance(["chat_compromise_defense", "slack_teams"], top_k=1)
    assert len(chat_results) >= 1
    assert any(k in chat_results[0].get("content", "").lower() or k in chat_results[0].get("category", "").lower() or k in chat_results[0].get("channel", "").lower() for k in ["chat", "slack", "teams", "messaging"])

    # Quishing
    quishing_results = retriever.retrieve_guidance(["quishing_detection", "qr_code"], top_k=1)
    assert len(quishing_results) >= 1
    assert any(k in quishing_results[0].get("content", "").lower() or k in quishing_results[0].get("category", "").lower() or k in quishing_results[0].get("channel", "").lower() for k in ["qr", "quishing"])

    # Cloud OAuth
    oauth_results = retriever.retrieve_guidance(["oauth_consent_defense", "cloud_oauth"], top_k=1)
    assert len(oauth_results) >= 1
    assert any(k in oauth_results[0].get("content", "").lower() or k in oauth_results[0].get("category", "").lower() or k in oauth_results[0].get("channel", "").lower() for k in ["oauth", "cloud", "permission", "saas"])


def test_api_coach_onboard_user_endpoint():
    payload = {
        "user_id": "test-user-dynamic-01",
        "job_title": "Senior Smart Contract Auditor",
        "department": "Security Assurance",
        "org_name": "Decentralized Finance Protocol",
        "org_description": "Audits EVM smart contracts, handles cryptographic multi-sig keys and cold storage."
    }
    response = client.post("/api/coach/onboard-user", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["role_analyzed"] == "Senior Smart Contract Auditor"
    assert "learning_profile" in data
    assert "next_focus" in data["learning_profile"]
    assert "target_channel" in data["learning_profile"]
    assert "primary_attack_surface" in data["learning_profile"]

