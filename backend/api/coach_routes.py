import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from supabase import create_client, Client

from agents.coach_agent import TrainingCoachAgent
from security.auth_bearer import get_current_user, CurrentUser
from runtime_store import (
    DECISIONS as RUNTIME_DECISIONS,
    LEARNING_PROFILES,
    get_decision,
    get_scenario as get_cached_scenario,
)
from graph.cyberguard_graph import coach_graph  # ← LangGraph

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
MOCK_LEARNING_PROFILES = LEARNING_PROFILES



class ProcessDecisionRequest(BaseModel):
    scenario_id: str = Field(min_length=36, max_length=36)
    # Legacy client fields are accepted but the stored Evaluation Agent result is authoritative.
    score: Optional[int] = None
    threat_type: Optional[str] = None
    weaknesses: List[str] = Field(default_factory=list)
    is_safe: Optional[bool] = None
    chosen_action: Optional[str] = None
    reasoning: Optional[str] = None
    user_id: Optional[str] = None


class OnboardUserRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    job_title: str
    department: Optional[str] = "General"
    org_name: Optional[str] = "NovaTech Solutions"
    org_description: Optional[str] = None


class DashboardSummaryResponse(BaseModel):
    success: bool
    data_source: str
    decision_count: int
    user: Dict[str, Any]
    readiness_score: int
    feedback_headline: str
    next_situation: Dict[str, Any]
    decision_journey: List[Dict[str, Any]]
    weakness_breakdown: Dict[str, int]
    channel_scores: Dict[str, Optional[int]]
    training_map: Optional[List[Dict[str, Any]]] = None
    learning_profile: Optional[Dict[str, Any]] = None


@router.post("/onboard-user")
async def onboard_user(
    request: OnboardUserRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    First-Time User Onboarding Endpoint (Member 3 - Dynamic AI Profiler):
    Dynamically analyzes any arbitrary job role, department, and org profile
    using LLM reasoning and multi-channel RAG from cyber_training.
    Establishes the learner's initial attack surface, threat channel, and personalized training map.
    """
    effective_user_id = current_user.id
    effective_email = current_user.email
    effective_name = request.full_name or current_user.full_name
    
    # 1. Execute Dynamic AI Role & Org Decomposition
    baseline_profile = coach_agent.analyze_first_time_user(
        job_title=request.job_title,
        department=request.department,
        org_name=request.org_name,
        org_description=request.org_description
    )

    # 2. Persist user into public.users and initialized profile in Supabase
    if supabase:
        try:
            # Guarantee user exists in public.users to satisfy Foreign Key constraints
            supabase.table("users").upsert({
                "id": effective_user_id,
                "email": effective_email,
                "full_name": effective_name,
                "role": request.job_title,
                "company": request.org_name,
                "readiness_score": 0
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=503, detail="User profile persistence failed") from e

        try:
            upsert_payload = {
                "user_id": effective_user_id,
                "next_difficulty": baseline_profile["next_difficulty"],
                "next_focus": baseline_profile["next_focus"],
                "tactic_to_target": baseline_profile["tactic_to_target"],
                "target_channel": baseline_profile["target_channel"],
                "primary_attack_surface": baseline_profile["primary_attack_surface"]
            }
            supabase.table("user_learning_profile").upsert({
                **upsert_payload,
                "training_map": baseline_profile.get("training_map"),
            }).execute()

            supabase.table("agent_audit_logs").insert({
                "agent_name": "CoachAgent (Member 3)",
                "user_id": effective_user_id,
                "action": "DYNAMIC_ONBOARDING_INITIALIZATION",
                "details": {
                    "input": request.model_dump(exclude={"user_id"}),
                    "output": baseline_profile,
                    "agent_trace": baseline_profile.get("agent_trace", []),
                }
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=503, detail="Onboarding persistence failed") from e

    # Update in-memory cache
    MOCK_LEARNING_PROFILES[effective_user_id] = {
        "next_difficulty": baseline_profile["next_difficulty"],
        "next_focus": baseline_profile["next_focus"],
        "tactic_to_target": baseline_profile["tactic_to_target"],
        "target_channel": baseline_profile["target_channel"],
        "primary_attack_surface": baseline_profile["primary_attack_surface"],
        "training_map": baseline_profile.get("training_map"),
        "coaching": {"feedback": baseline_profile["orientation_tip"]}
    }

    return {
        "success": True,
        "user_id": effective_user_id,
        "role_analyzed": request.job_title,
        "learning_profile": baseline_profile,
        "training_map": baseline_profile.get("training_map")
    }


@router.post("/process-decision")
async def process_decision(
    request: ProcessDecisionRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Inter-Agent Endpoint: Receives Member 2's evaluation payload,
    triggers the Training Coach Agent, updates user_learning_profile in Supabase,
    and returns personalized pedagogical guidance.
    """
    user_id = current_user.id

    # Load the Evaluation Agent output saved for this learner and scenario. Browser
    # supplied scores and weaknesses are never trusted as the coaching authority.
    stored_decision = None
    if supabase:
        try:
            decision_res = (
                supabase.table("decisions")
                .select("*")
                .eq("user_id", user_id)
                .eq("scenario_id", request.scenario_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if decision_res.data:
                stored_decision = decision_res.data[0]
        except Exception as e:
            raise HTTPException(status_code=503, detail="Decision retrieval failed") from e
    if not stored_decision and not supabase:
        stored_decision = get_decision(request.scenario_id, user_id)
    if not stored_decision:
        raise HTTPException(status_code=404, detail="No evaluated decision exists for this scenario and user")

    stored_evaluation = stored_decision.get("evaluation") or {}
    authoritative_score = float(stored_evaluation.get("final_score", 0))
    authoritative_safe = bool(stored_decision.get("is_safe", False))
    authoritative_weaknesses = stored_evaluation.get("weaknesses") or []

    scenario_record = None
    if supabase:
        try:
            scenario_res = (
                supabase.table("scenarios")
                .select("id,user_id,content")
                .eq("id", request.scenario_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            if scenario_res.data:
                scenario_record = scenario_res.data[0]
        except Exception as e:
            raise HTTPException(status_code=503, detail="Scenario retrieval failed") from e
    else:
        scenario_record = get_cached_scenario(request.scenario_id, user_id)
    scenario_content = scenario_record.get("content", {}) if scenario_record else {}
    threat_type = str(scenario_content.get("threat_type") or "cybersecurity awareness")
    target_channel = str(scenario_content.get("channel") or "email")
    
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
            raise HTTPException(status_code=503, detail="Learning history retrieval failed") from e

    if not past_decisions and not supabase:
        past_decisions = [d for d in RUNTIME_DECISIONS.values() if d.get("user_id") == user_id]
    if current_difficulty == "beginner" and not supabase:
        current_difficulty = MOCK_LEARNING_PROFILES.get(user_id, {}).get("next_difficulty", "beginner")

    # Evaluation saved this decision already; Coach appends its score separately.
    past_decisions = [d for d in past_decisions if str(d.get("scenario_id")) != request.scenario_id]

    # Structure payload for coach agent
    eval_payload = {
        "scenario_id": request.scenario_id,
        "final_score": authoritative_score,
        "threat_indicators": stored_evaluation.get("threat_indicators", []),
        "weaknesses": authoritative_weaknesses,
        "is_safe": authoritative_safe,
        "chosen_action": stored_decision.get("chosen_action", "Unspecified"),
        "reasoning": stored_decision.get("reasoning", ""),
        "channel": target_channel
    }

    # ── Run the LangGraph coach_node (LangSmith traces automatically) ──
    graph_state = coach_graph.invoke(
        {
            "user_id": user_id,
            "evaluation_result": eval_payload,
            "past_decisions": past_decisions,
            "current_difficulty": current_difficulty,
            "agent_trace": [],
        },
        config={
            "configurable": {"thread_id": f"coach-{request.scenario_id}"},
            "tags": ["coaching", f"user:{user_id}"],
            "metadata": {"scenario_id": request.scenario_id, "user_id": user_id},
        },
    )
    coaching_result = graph_state.get("coaching_result") or {}



    # 3. Update user learning profile & user score in Supabase
    next_diff = coaching_result["next_difficulty"]
    next_topic = coaching_result["recommended_topic"]
    weakness_target = authoritative_weaknesses[0] if authoritative_weaknesses else threat_type

    if supabase:
        try:
            supabase.table("user_learning_profile").upsert({
                "user_id": user_id,
                "next_difficulty": next_diff,
                "next_focus": next_topic,
                "tactic_to_target": weakness_target,
                "target_channel": target_channel,
            }).execute()

            # Calculate and update new average readiness score in public.users
            all_scores = []
            offset = 0
            while True:
                score_page = (supabase.table("decisions").select("evaluation")
                              .eq("user_id", user_id).range(offset, offset + 999).execute().data or [])
                all_scores.extend(
                    float(row["evaluation"]["final_score"])
                    for row in score_page
                    if isinstance(row.get("evaluation"), dict)
                    and isinstance(row["evaluation"].get("final_score"), (int, float))
                )
                if len(score_page) < 1000:
                    break
                offset += 1000
            avg_score = round(sum(all_scores) / len(all_scores)) if all_scores else 0
            supabase.table("users").update({"readiness_score": avg_score}).eq("id", user_id).execute()
            
            supabase.table("agent_audit_logs").insert({
                "agent_name": "CoachAgent (Member 3)",
                "user_id": user_id,
                "action": "UPDATE_LEARNING_PROFILE",
                "details": {
                    "scenario_id": request.scenario_id,
                    "input": {"evaluation": eval_payload, "past_decisions": past_decisions,
                              "current_difficulty": current_difficulty},
                    "output": coaching_result,
                    "agent_trace": graph_state.get("agent_trace", []),
                }
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=503, detail="Coaching persistence failed") from e

    # Update in-memory fallback store
    previous_profile = MOCK_LEARNING_PROFILES.get(user_id, {})
    MOCK_LEARNING_PROFILES[user_id] = {
        **previous_profile,
        "next_difficulty": next_diff,
        "next_focus": next_topic,
        "tactic_to_target": weakness_target,
        "target_channel": target_channel,
        "coaching": coaching_result
    }

    return {
        "success": True,
        "user_id": user_id,
        "coaching": coaching_result
    }


@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Returns live dashboard telemetry, weakness distributions,
    decision journey history, and the next situation launcher parameters
    directly from Supabase database tables (decisions, user_learning_profile, users).
    """
    effective_user_id = current_user.id
    effective_user_name = current_user.full_name
    effective_user_role = current_user.role
    effective_access_role = current_user.access_role

    profile_data = {}
    user_decisions = []
    scenario_channels: Dict[str, str] = {}
    effective_company = current_user.company

    # 1. Query live Supabase database
    if supabase:
        try:
            # Fetch user learning profile
            prof_res = supabase.table("user_learning_profile").select("*").eq("user_id", effective_user_id).execute()
            if prof_res.data and len(prof_res.data) > 0:
                profile_data = prof_res.data[0]

            # Fetch user decisions history
            offset = 0
            while True:
                dec_res = (supabase.table("decisions").select("*")
                           .eq("user_id", effective_user_id)
                           .order("created_at", desc=True)
                           .range(offset, offset + 999).execute())
                page = dec_res.data or []
                user_decisions.extend(page)
                if len(page) < 1000:
                    break
                offset += 1000

            scenario_ids = list({str(d["scenario_id"]) for d in user_decisions if d.get("scenario_id")})
            for start in range(0, len(scenario_ids), 100):
                scenario_res = (supabase.table("scenarios").select("id,content")
                                .in_("id", scenario_ids[start:start + 100]).execute())
                scenario_channels.update({
                    str(row["id"]): str((row.get("content") or {}).get("channel") or "unknown")
                    for row in (scenario_res.data or [])
                })

            audit_res = (supabase.table("agent_audit_logs").select("details")
                         .eq("user_id", effective_user_id)
                         .eq("action", "UPDATE_LEARNING_PROFILE")
                         .order("created_at", desc=True).limit(1).execute())
            if audit_res.data:
                details = audit_res.data[0].get("details") or {}
                profile_data["coaching"] = details.get("output", details)

            # Fetch user record for readiness score & name if not in JWT
            u_res = supabase.table("users").select("*").eq("id", effective_user_id).execute()
            if u_res.data and len(u_res.data) > 0:
                user_row = u_res.data[0]
                effective_user_name = user_row.get("full_name") or effective_user_name
                effective_user_role = user_row.get("role") or effective_user_role
                effective_company = user_row.get("company") or effective_company
        except Exception as e:
            raise HTTPException(status_code=503, detail="Dashboard database retrieval failed") from e

    # Fallback to in-memory store if DB had no rows
    if not user_decisions and not supabase:
        user_decisions = [d for d in RUNTIME_DECISIONS.values() if d.get("user_id") == effective_user_id]
    if not profile_data and not supabase:
        profile_data = MOCK_LEARNING_PROFILES.get(effective_user_id, {})

    for decision in user_decisions:
        evaluation = decision.get("evaluation") or {}
        decision["channel"] = (
            evaluation.get("channel") if isinstance(evaluation, dict) else None
        ) or scenario_channels.get(str(decision.get("scenario_id"))) or (
            (get_cached_scenario(str(decision.get("scenario_id")), effective_user_id) or {})
            .get("content", {}).get("channel") if not supabase else None
        )

    next_difficulty = profile_data.get("next_difficulty", "beginner")
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
        raw_weaknesses = (
            eval_data.get("weaknesses") or eval_data.get("threat_indicators")
            if isinstance(eval_data, dict)
            else None
        )
        if isinstance(raw_weaknesses, dict):
            weaknesses = list(raw_weaknesses.keys())
        elif isinstance(raw_weaknesses, list):
            weaknesses = raw_weaknesses
        elif raw_weaknesses:
            weaknesses = [str(raw_weaknesses)]
        else:
            weaknesses = ["Social Engineering"]
        threat = weaknesses[0] if weaknesses else "Threat Vector"

        dec_channel = d.get("channel") or eval_data.get("channel") or "unknown"

        journey.append({
            "id": idx,
            "title": d.get("chosen_action", f"Scenario {idx}"),
            "threat": str(threat).replace("_", " ").title(),
            "score": score,
            "status": "Defense Mastered" if is_safe else "Learning Opportunity",
            "is_safe": is_safe,
            "channel": dec_channel,
            "reasoning": d.get("reasoning", "")
        })

    # 3. Calculate dynamic Readiness Score
    if user_decisions:
        scores = []
        for d in user_decisions:
            eval_data = d.get("evaluation")
            if isinstance(eval_data, dict) and "final_score" in eval_data:
                scores.append(float(eval_data["final_score"]))
        readiness_score = round(sum(scores) / len(scores)) if scores else 0
    else:
        readiness_score = 0

    # 4. Calculate measured channel scores. A missing channel has no measured score.
    channel_samples: Dict[str, List[float]] = {}
    for d in user_decisions:
        evaluation = d.get("evaluation") or {}
        channel = d.get("channel") or evaluation.get("channel")
        score = evaluation.get("final_score")
        if channel and isinstance(score, (int, float)):
            channel_samples.setdefault(channel, []).append(float(score))
    channel_scores = {
        channel: round(sum(channel_samples[channel]) / len(channel_samples[channel]))
        if channel_samples.get(channel) else None
        for channel in ("email", "voice_phone", "slack_teams", "qr_code",
                        "cloud_oauth", "sms_push", "physical_media")
    }

    # Legacy category labels are derived only from measured channels.
    weakness_breakdown = {
        "Phishing & Spoofing": channel_scores["email"] or 0,
        "Urgency & BEC Defense": channel_scores["voice_phone"] or 0,
        "Data Protection & Privacy": channel_scores["physical_media"] or 0,
        "Policy Compliance & Verification": channel_scores["cloud_oauth"] or 0,
    }

    target_channel = profile_data.get("target_channel", "email")
    attack_surface = profile_data.get("primary_attack_surface", f"Assets associated with {effective_user_role}")

    next_situation = {
        "title": f"Adaptive Challenge: {next_focus}",
        "role": effective_user_role,
        "category": next_focus,
        "channel": target_channel,
        "primary_attack_surface": attack_surface,
        "difficulty": next_difficulty,
        "estimated_minutes": 3,
        "tactic_target": tactic_target
    }

    # Retrieve or dynamically synthesize role-specific training map
    training_map = profile_data.get("training_map")
    if not training_map or not isinstance(training_map, list):
        training_map = coach_agent._synthesize_training_map(
            job_title=effective_user_role,
            org_name=effective_company,
            target_channel=target_channel,
            target_topic=next_focus
        )

    return DashboardSummaryResponse(
        success=True,
        data_source="supabase" if supabase else "memory",
        decision_count=len(user_decisions),
        user={
            "id": effective_user_id,
            "name": effective_user_name,
            "role": effective_user_role,
            "access_role": effective_access_role,
            "company": effective_company,
        },
        readiness_score=readiness_score,
        feedback_headline=headline,
        next_situation=next_situation,
        decision_journey=journey,
        weakness_breakdown=weakness_breakdown,
        channel_scores=channel_scores,
        training_map=training_map,
        learning_profile=profile_data
    )

