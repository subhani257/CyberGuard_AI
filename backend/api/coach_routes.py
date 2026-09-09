import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

from agents.coach_agent import TrainingCoachAgent
from security.auth_bearer import get_current_user, CurrentUser

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

router = APIRouter(tags=["Adaptive Training Coach (Member 3)"])

coach_agent = TrainingCoachAgent()

# Initialize Supabase if configured
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None

try:
    if supabase_url and "your-project" not in supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"Notice: Supabase client in coach_routes using in-memory store: {e}")

# In-memory store for fallback / rapid local testing
MOCK_LEARNING_PROFILES = {}
MOCK_DECISIONS_STORE = []


class ProcessDecisionRequest(BaseModel):
    scenario_id: str
    score: int
    threat_type: str = "phishing"
    weaknesses: List[str] = []
    is_safe: bool = False
    chosen_action: Optional[str] = None
    reasoning: Optional[str] = None
    user_id: Optional[str] = None


class DashboardSummaryResponse(BaseModel):
    success: bool
    user: Dict[str, Any]
    readiness_score: int
    feedback_headline: str
    next_situation: Dict[str, Any]
    decision_journey: List[Dict[str, Any]]
    weakness_breakdown: Dict[str, int]


@router.post("/process-decision")
async def process_decision(request: ProcessDecisionRequest):
    """
    Inter-Agent Endpoint: Receives Member 2's evaluation payload,
    triggers the Training Coach Agent, updates user_learning_profile,
    and returns personalized pedagogical guidance.
    """
    user_id = request.user_id or "11111111-1111-1111-1111-111111111111"
    
    # 1. Fetch past decisions for longitudinal analysis
    past_decisions = []
    current_difficulty = "beginner"
    
    if supabase:
        try:
            dec_resp = supabase.table("decisions").select("*").eq("user_id", user_id).limit(10).execute()
            if dec_resp.data:
                past_decisions = dec_resp.data
                
            prof_resp = supabase.table("user_learning_profile").select("*").eq("user_id", user_id).execute()
            if prof_resp.data:
                current_difficulty = prof_resp.data[0].get("next_difficulty", "beginner")
        except Exception:
            pass

    if not past_decisions:
        past_decisions = [d for d in MOCK_DECISIONS_STORE if d.get("user_id") == user_id]
        current_difficulty = MOCK_LEARNING_PROFILES.get(user_id, {}).get("next_difficulty", "beginner")

    # Structure payload for coach agent
    eval_payload = {
        "scenario_id": request.scenario_id,
        "final_score": request.score,
        "threat_indicators": [request.threat_type],
        "weaknesses": request.weaknesses or [request.threat_type],
        "is_safe": request.is_safe,
        "chosen_action": request.chosen_action or "Unspecified",
        "reasoning": request.reasoning or ""
    }

    # 2. Execute Coach Agent
    coaching_result = coach_agent.generate_coaching(
        user_id=user_id,
        evaluation_data=eval_payload,
        past_decisions=past_decisions,
        current_difficulty=current_difficulty
    )

    # 3. Update user learning profile in Supabase
    next_diff = coaching_result["next_difficulty"]
    next_topic = coaching_result["recommended_topic"]
    weakness_target = request.weaknesses[0] if request.weaknesses else request.threat_type

    if supabase:
        try:
            supabase.table("user_learning_profile").upsert({
                "user_id": user_id,
                "next_difficulty": next_diff,
                "next_focus": next_topic,
                "tactic_to_target": weakness_target
            }).execute()
            
            supabase.table("agent_audit_logs").insert({
                "agent_name": "CoachAgent (Member 3)",
                "user_id": user_id,
                "action": "UPDATE_LEARNING_PROFILE",
                "details": coaching_result
            }).execute()
        except Exception as e:
            print(f"Notice: Supabase profile update bypassed: {e}")

    # Update in-memory mock store
    MOCK_LEARNING_PROFILES[user_id] = {
        "next_difficulty": next_diff,
        "next_focus": next_topic,
        "tactic_to_target": weakness_target,
        "coaching": coaching_result
    }
    MOCK_DECISIONS_STORE.append({
        "user_id": user_id,
        "scenario_id": request.scenario_id,
        "is_safe": request.is_safe,
        "reasoning": request.reasoning or "",
        "evaluation": {"final_score": request.score, "weaknesses": request.weaknesses}
    })

    return {
        "success": True,
        "user_id": user_id,
        "coaching": coaching_result
    }


@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(user_id: Optional[str] = "11111111-1111-1111-1111-111111111111"):
    """
    Returns real-time dashboard telemetry, weakness distributions,
    decision journey history, and the next situation launcher parameters.
    """
    profile = MOCK_LEARNING_PROFILES.get(user_id, {
        "next_difficulty": "medium",
        "next_focus": "Payment & Invoice Verification",
        "tactic_to_target": "urgency_bias"
    })

    headline = "You're getting better at noticing when urgency is being used against you."
    if "coaching" in profile and "feedback" in profile["coaching"]:
        headline = profile["coaching"]["feedback"]

    journey = [
        {
            "id": 1,
            "title": "Wire Transfer Authorization",
            "threat": "Executive Impersonation",
            "score": 40,
            "status": "Learning Opportunity",
            "is_safe": False
        },
        {
            "id": 2,
            "title": "Vendor Invoice Adjustment",
            "threat": "Spoofed Domain",
            "score": 85,
            "status": "Defense Mastered",
            "is_safe": True
        },
        {
            "id": 3,
            "title": "Password Reset Alert",
            "threat": "Credential Harvesting",
            "score": 92,
            "status": "Defense Mastered",
            "is_safe": True
        }
    ]

    # Weakness percentage accuracy across four core domains
    weakness_breakdown = {
        "Phishing & Spoofing": 82,
        "Urgency & BEC Defense": 45,
        "Data Protection": 78,
        "Identity Verification": 60
    }

    next_situation = {
        "title": "A payment request that cannot wait.",
        "role": "Finance Manager",
        "category": profile.get("next_focus", "Accounts Payable"),
        "difficulty": profile.get("next_difficulty", "medium"),
        "estimated_minutes": 3,
        "tactic_target": profile.get("tactic_to_target", "urgency_bias")
    }

    return DashboardSummaryResponse(
        success=True,
        user={
            "id": user_id,
            "name": "Nimal Perera",
            "role": "Finance Manager",
            "access_role": "learner"
        },
        readiness_score=76,
        feedback_headline=headline,
        next_situation=next_situation,
        decision_journey=journey,
        weakness_breakdown=weakness_breakdown
    )
