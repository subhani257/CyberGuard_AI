import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

from agents.coach_agent import TrainingCoachAgent
from security.auth_bearer import get_current_user, get_optional_current_user, CurrentUser

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
    triggers the Training Coach Agent, updates user_learning_profile in Supabase,
    and returns personalized pedagogical guidance.
    """
    user_id = request.user_id or "11111111-1111-1111-1111-111111111111"
    
    # 1. Fetch past decisions from Supabase for longitudinal analysis
    past_decisions = []
    current_difficulty = "beginner"
    
    if supabase:
        try:
            dec_resp = supabase.table("decisions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
            if dec_resp.data:
                past_decisions = dec_resp.data
                
            prof_resp = supabase.table("user_learning_profile").select("*").eq("user_id", user_id).execute()
            if prof_resp.data and len(prof_resp.data) > 0:
                current_difficulty = prof_resp.data[0].get("next_difficulty", "beginner")
        except Exception as e:
            print(f"Notice: Supabase read in process-decision: {e}")

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

    # 3. Update user learning profile & user score in Supabase
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

            # Calculate and update new average readiness score in public.users
            all_scores = [d.get("evaluation", {}).get("final_score", request.score) for d in past_decisions if isinstance(d.get("evaluation"), dict)]
            all_scores.append(request.score)
            avg_score = round(sum(all_scores) / len(all_scores)) if all_scores else request.score
            supabase.table("users").update({"readiness_score": avg_score}).eq("id", user_id).execute()
            
            supabase.table("agent_audit_logs").insert({
                "agent_name": "CoachAgent (Member 3)",
                "user_id": user_id,
                "action": "UPDATE_LEARNING_PROFILE",
                "details": coaching_result
            }).execute()
        except Exception as e:
            print(f"Notice: Supabase profile update bypassed: {e}")

    # Update in-memory fallback store
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
async def get_dashboard_summary(
    user_id: Optional[str] = "11111111-1111-1111-1111-111111111111",
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user)
):
    """
    Returns live dashboard telemetry, weakness distributions,
    decision journey history, and the next situation launcher parameters
    directly from Supabase database tables (decisions, user_learning_profile, users).
    """
    effective_user_id = (current_user.id if current_user else user_id) or "11111111-1111-1111-1111-111111111111"
    effective_user_name = current_user.full_name if current_user else "User"
    effective_user_role = current_user.role if current_user else "Employee"
    effective_access_role = current_user.access_role if current_user else "learner"

    profile_data = {}
    user_decisions = []
    db_readiness_score = None

    # 1. Query live Supabase database
    if supabase:
        try:
            # Fetch user learning profile
            prof_res = supabase.table("user_learning_profile").select("*").eq("user_id", effective_user_id).execute()
            if prof_res.data and len(prof_res.data) > 0:
                profile_data = prof_res.data[0]

            # Fetch user decisions history
            dec_res = supabase.table("decisions").select("*").eq("user_id", effective_user_id).order("created_at", desc=True).limit(10).execute()
            if dec_res.data:
                user_decisions = dec_res.data

            # Fetch user record for readiness score & name if not in JWT
            u_res = supabase.table("users").select("*").eq("id", effective_user_id).execute()
            if u_res.data and len(u_res.data) > 0:
                user_row = u_res.data[0]
                db_readiness_score = user_row.get("readiness_score")
                if not current_user:
                    effective_user_name = user_row.get("full_name") or effective_user_name
                    effective_user_role = user_row.get("role") or effective_user_role
        except Exception as e:
            print(f"Notice: Supabase fetch in dashboard-summary: {e}")

    # Fallback to in-memory store if DB had no rows
    if not user_decisions:
        user_decisions = [d for d in MOCK_DECISIONS_STORE if d.get("user_id") == effective_user_id]
    if not profile_data:
        profile_data = MOCK_LEARNING_PROFILES.get(effective_user_id, {})

    next_difficulty = profile_data.get("next_difficulty", "medium")
    next_focus = profile_data.get("next_focus", "Payment & Invoice Verification")
    tactic_target = profile_data.get("tactic_to_target", "urgency_bias")

    headline = "Welcome — your first adaptive simulation is ready. Let's establish your baseline."
    if "coaching" in profile_data and isinstance(profile_data["coaching"], dict) and "feedback" in profile_data["coaching"]:
        headline = profile_data["coaching"]["feedback"]
    elif user_decisions:
        last_dec = user_decisions[0]
        if last_dec.get("is_safe"):
            headline = "Great defense on your recent simulation! Let's build consistency."
        else:
            headline = "You're getting better at noticing subtle security indicators. Keep practicing."

    # 2. Build Decision Journey from real decisions
    journey = []
    for idx, d in enumerate(user_decisions[:5], start=1):
        eval_data = d.get("evaluation") or {}
        score = eval_data.get("final_score", 0) if isinstance(eval_data, dict) else 0
        is_safe = d.get("is_safe", False)
        weaknesses = eval_data.get("weaknesses") or eval_data.get("threat_indicators") or ["Social Engineering"] if isinstance(eval_data, dict) else ["Social Engineering"]
        threat = weaknesses[0] if weaknesses else "Threat Vector"

        journey.append({
            "id": idx,
            "title": d.get("chosen_action", f"Scenario {idx}"),
            "threat": str(threat).replace("_", " ").title(),
            "score": score,
            "status": "Defense Mastered" if is_safe else "Learning Opportunity",
            "is_safe": is_safe
        })

    # 3. Calculate dynamic Readiness Score
    if db_readiness_score is not None and db_readiness_score > 0:
        readiness_score = db_readiness_score
    elif user_decisions:
        scores = []
        for d in user_decisions:
            eval_data = d.get("evaluation")
            if isinstance(eval_data, dict) and "final_score" in eval_data:
                scores.append(eval_data["final_score"])
        readiness_score = round(sum(scores) / len(scores)) if scores else 0
    else:
        readiness_score = 0

    # 4. Calculate dynamic weakness breakdown
    weakness_breakdown = {
        "Phishing & Spoofing": 0,
        "Urgency & BEC Defense": 0,
        "Data Protection": 0,
        "Identity Verification": 0
    }

    if user_decisions:
        # Tally scores per category
        phishing_scores = []
        urgency_scores = []
        data_scores = []
        id_scores = []
        for d in user_decisions:
            eval_data = d.get("evaluation") or {}
            score = eval_data.get("final_score", 50) if isinstance(eval_data, dict) else 50
            action = str(d.get("chosen_action", "")).lower()
            reasoning = str(d.get("reasoning", "")).lower()

            if "phish" in action or "email" in action or "link" in action:
                phishing_scores.append(score)
            if "urgent" in reasoning or "wire" in action or "transfer" in action:
                urgency_scores.append(score)
            if "data" in reasoning or "privacy" in reasoning or "credential" in reasoning:
                data_scores.append(score)
            if "verify" in reasoning or "call" in action or "identity" in reasoning:
                id_scores.append(score)

        if phishing_scores:
            weakness_breakdown["Phishing & Spoofing"] = round(sum(phishing_scores) / len(phishing_scores))
        if urgency_scores:
            weakness_breakdown["Urgency & BEC Defense"] = round(sum(urgency_scores) / len(urgency_scores))
        if data_scores:
            weakness_breakdown["Data Protection"] = round(sum(data_scores) / len(data_scores))
        if id_scores:
            weakness_breakdown["Identity Verification"] = round(sum(id_scores) / len(id_scores))

    next_situation = {
        "title": f"Adaptive Challenge: {next_focus}",
        "role": effective_user_role,
        "category": next_focus,
        "difficulty": next_difficulty,
        "estimated_minutes": 3,
        "tactic_target": tactic_target
    }

    return DashboardSummaryResponse(
        success=True,
        user={
            "id": effective_user_id,
            "name": effective_user_name,
            "role": effective_user_role,
            "access_role": effective_access_role
        },
        readiness_score=readiness_score,
        feedback_headline=headline,
        next_situation=next_situation,
        decision_journey=journey,
        weakness_breakdown=weakness_breakdown
    )

