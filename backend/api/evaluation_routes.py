from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import re
import time
from datetime import datetime

import os
from dotenv import load_dotenv
from supabase import create_client, Client

from security.auth_bearer import get_current_user, CurrentUser
from runtime_store import get_scenario as get_cached_scenario, save_decision
from graph.cyberguard_graph import evaluation_graph  # ← LangGraph

# Load .env
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_env = os.path.join(backend_dir, '.env')
project_root = os.path.dirname(backend_dir)
root_env = os.path.join(project_root, '.env')

if os.path.exists(backend_env):
    load_dotenv(backend_env)
elif os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

router = APIRouter()


# Initialize Supabase safely with fallback
supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Optional[Client] = None

if supabase_url and supabase_key and "your-project" not in supabase_url:
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Warning: Supabase client init failed in evaluation_routes: {e}")

# Rate limiting (simple in-memory implementation)
rate_limit_store = {}
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60  # seconds

def check_rate_limit(user_id: str) -> bool:
    current_time = time.time()
    if user_id not in rate_limit_store:
        rate_limit_store[user_id] = []
    
    # Remove old requests outside the time window
    rate_limit_store[user_id] = [t for t in rate_limit_store[user_id] if current_time - t < RATE_LIMIT_WINDOW]
    
    if len(rate_limit_store[user_id]) >= RATE_LIMIT_REQUESTS:
        return False
    
    rate_limit_store[user_id].append(current_time)
    return True

# Audit logging
def log_audit_event(event_type: str, user_id: str, details: Dict[str, Any]):
    try:
        if supabase:
            valid_uuid = user_id if (user_id and user_id != "anonymous" and len(user_id) > 20) else None
            log_entry = {
                "agent_name": "EvaluationAgent (Member 2)",
                "action": event_type,
                "user_id": valid_uuid,
                "details": details
            }
            # Save to audit_logs table
            supabase.table("agent_audit_logs").insert(log_entry).execute()
    except Exception as e:
        print(f"Notice: Audit logging bypassed: {e}")


class EvaluationRequest(BaseModel):
    scenario_id: str = Field(min_length=1, max_length=128)
    user_action: str = Field(min_length=1, max_length=1000)
    user_reasoning: str = Field(min_length=1, max_length=2000)
    # Backward-compatible only. The authenticated subject is authoritative.
    user_id: Optional[str] = None


class EvaluationResponse(BaseModel):
    success: bool
    evaluation: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_decision(
    request: EvaluationRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Unified evaluation endpoint that performs security analysis and decision evaluation.
    
    Security measures:
    - Input validation and sanitization
    - Rate limiting
    - JWT authentication verification
    - Audit logging
    
    Process:
    1. Extract threat indicators from scenario
    2. Determine expected safe behavior
    3. Retrieve threat knowledge from RAG
    4. Classify user reasoning
    5. Apply scoring rubric
    6. Get LLM evaluation
    7. Save results to database
    """
    user_id = current_user.id
    if not check_rate_limit(user_id):
        log_audit_event("rate_limit_exceeded", user_id, {"endpoint": "/evaluate"})
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Security: Audit logging for request
    log_audit_event("evaluation_request", user_id, {
        "scenario_id": request.scenario_id,
        "user_action": request.user_action
    })
    try:
        # Step 1: Get scenario content from database
        scenario_record = None
        clean_scenario_id = request.scenario_id.strip().strip('"\'')
        if supabase:
            try:
                scenario_data = (
                    supabase.table("scenarios")
                    .select("*")
                    .eq("id", clean_scenario_id)
                    .eq("user_id", user_id)
                    .execute()
                )
                if scenario_data and scenario_data.data:
                    scenario_record = scenario_data.data[0]
            except Exception as e:
                raise HTTPException(status_code=503, detail="Scenario retrieval failed") from e

        if not scenario_record and not supabase:
            scenario_record = get_cached_scenario(clean_scenario_id, user_id)

        if not scenario_record:
            raise HTTPException(status_code=404, detail="Scenario not found for authenticated user")

        scenario_content = scenario_record.get("content") or {}
        scenario_text = _extract_scenario_text(scenario_content)
        if not scenario_text:
            raise HTTPException(status_code=422, detail="Scenario has no evaluable content")

        def _normalize_choice_text(text: str) -> str:
            import re
            if not text:
                return ""
            t = text.strip().casefold()
            t = re.sub(r'^(?:[a-z0-9]+[\.\)\:]\s*|option\s+[a-z0-9]+\:\s*)', '', t)
            t = t.strip('\'"`.,;:!?')
            return t

        def _is_valid_choice(user_action: str, choices: list) -> bool:
            if not choices or not user_action:
                return True
            req_raw = user_action.strip().casefold()
            req_norm = _normalize_choice_text(user_action)

            for ch in choices:
                ch_str = str(ch).strip()
                ch_raw = ch_str.casefold()
                ch_norm = _normalize_choice_text(ch_str)

                if req_raw == ch_raw or req_norm == ch_norm:
                    return True

                if len(req_norm) >= 4 and len(ch_norm) >= 4:
                    if req_norm in ch_norm or ch_norm in req_norm:
                        return True

            common_verbs = [
                "verify", "check", "report", "deny", "approve", "contact", "confirm", 
                "forward", "delete", "ignore", "call", "inspect", "hand", "flag", 
                "pay", "wire", "comply", "click", "download", "scan", "authenticate",
                "refuse", "reject", "escalate"
            ]
            if any(verb in req_raw for verb in common_verbs):
                return True

            return False

        # Choice matching: action must match one of the generated scenario choices
        choices = scenario_content.get("choices") or []
        if choices and not _is_valid_choice(request.user_action, choices):
            raise HTTPException(status_code=422, detail="Selected action is not one of this scenario's choices")

        # ── Run the LangGraph evaluation_graph (LangSmith traces automatically) ──
        graph_state = evaluation_graph.invoke(
            {
                "user_id": user_id,
                "scenario_content": scenario_content,
                "user_action": request.user_action,
                "user_reasoning": request.user_reasoning,
                "agent_trace": [],
            },
            config={
                "configurable": {"thread_id": clean_scenario_id},
                "tags": ["evaluation", f"user:{user_id}"],
                "metadata": {"scenario_id": clean_scenario_id, "user_id": user_id},
            },
        )

        evaluation_result = graph_state.get("evaluation_result", {})
        threat_indicators = graph_state.get("threat_indicators", {})
        safe_behavior = graph_state.get("safe_behavior", {})
        threat_knowledge = graph_state.get("threat_knowledge", {})
        reasoning_classification = graph_state.get("reasoning_classification", {})
        human_review_required = graph_state.get("human_review_required", False)

        # Step 7: Save to database
        await _save_evaluation_to_database(
            scenario_id=clean_scenario_id,
            user_id=user_id,
            user_action=request.user_action,
            user_reasoning=request.user_reasoning,
            evaluation_result=evaluation_result,
            channel=str(scenario_content.get("channel") or "email"),
            threat_analysis={
                "indicators": threat_indicators,
                "safe_behavior": safe_behavior,
                "threat_knowledge": threat_knowledge,
                "reasoning_classification": reasoning_classification,
                "human_review_required": human_review_required,
                "agent_trace": graph_state.get("agent_trace", []),
            }
        )

        # Return combined results (same shape as before — frontend unchanged)
        return EvaluationResponse(
            success=True,
            evaluation={
                "threat_analysis": {
                    "indicators": threat_indicators,
                    "safe_behavior": safe_behavior,
                    "threat_knowledge": threat_knowledge.get("threat_knowledge", {}),
                    "scenario_clues": scenario_content.get("clues_embedded", [])
                },
                "reasoning_analysis": reasoning_classification,
                "evaluation": evaluation_result,
                "human_review_required": human_review_required,
                "agent_trace": graph_state.get("agent_trace", []),
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        return EvaluationResponse(
            success=False,
            error=f"Evaluation failed: {str(e)}"
        )



def _extract_scenario_text(scenario_content: Dict[str, Any]) -> str:
    """
    Converts any scenario JSON into a flat text string for NLP analysis.
    Handles all scenario types: Email, SMS, Slack/DM, Vishing, QR Code,
    Supply Chain, Cloud App, MFA Fatigue — without assuming any specific format.
    """
    parts = []

    # --- Priority fields: always include context clues if available ---
    if scenario_content.get("situation_title"):
        parts.append(f"Situation: {scenario_content['situation_title']}")
    if scenario_content.get("situation_tagline"):
        parts.append(f"Context: {scenario_content['situation_tagline']}")
    if scenario_content.get("threat_type"):
        parts.append(f"Threat Category: {scenario_content['threat_type']}")

    # --- Sender / Identity fields (Email, Slack, SMS, Vishing) ---
    if scenario_content.get("sender_name"):
        parts.append(f"From: {scenario_content['sender_name']}")
    if scenario_content.get("sender_email"):
        parts.append(f"Email: {scenario_content['sender_email']}")
    if scenario_content.get("caller"):
        parts.append(f"Caller: {scenario_content['caller']}")
    if scenario_content.get("phone_number"):
        parts.append(f"Phone: {scenario_content['phone_number']}")
    if scenario_content.get("platform"):
        parts.append(f"Platform: {scenario_content['platform']}")
    if scenario_content.get("channel"):
        parts.append(f"Channel: {scenario_content['channel']}")

    # --- Message content fields (any platform) ---
    if scenario_content.get("subject"):
        parts.append(f"Subject: {scenario_content['subject']}")
    if scenario_content.get("body"):
        parts.append(f"Body: {scenario_content['body']}")
    if scenario_content.get("message_content"):
        parts.append(f"Message: {scenario_content['message_content']}")
    if scenario_content.get("message"):
        parts.append(f"Message: {scenario_content['message']}")
    if scenario_content.get("description"):
        parts.append(f"Description: {scenario_content['description']}")

    # --- Channel specific data ---
    channel_data = scenario_content.get("channel_data")
    if isinstance(channel_data, dict):
        for key, value in channel_data.items():
            if isinstance(value, list):
                rendered = " ".join(
                    " ".join(str(v) for v in item.values()) if isinstance(item, dict) else str(item)
                    for item in value
                )
            elif isinstance(value, dict):
                rendered = " ".join(str(v) for v in value.values())
            else:
                rendered = str(value)
            parts.append(f"{key.replace('_', ' ')}: {rendered}")

    # --- Embedded clues (always include for richer NLP context) ---
    if scenario_content.get("clues_embedded") and isinstance(scenario_content["clues_embedded"], list):
        parts.append(f"Clues: {' '.join(scenario_content['clues_embedded'])}")

    # --- Fallback: if nothing specific found, stringify all string values ---
    if not parts:
        for key, value in scenario_content.items():
            if isinstance(value, str) and len(value) > 3:
                parts.append(f"{key}: {value}")
    return " ".join(parts)


def _derive_weaknesses(
    threat_indicators: Dict[str, Any],
    reasoning_classification: Dict[str, Any],
    is_safe: bool,
    channel: str = "email"
) -> list[str]:
    """Create the Coach handoff from observed behavior instead of a UI constant."""
    if is_safe:
        return []

    # Gap 3 fix: full mapping covering all 11 threat indicator categories
    mapping = {
        # Original 6
        "urgency_indicators":    "urgency_bias",
        "authority_abuse":       "authority_bias",
        "spoofed_domains":       "sender_verification",
        "spoofed_identifiers":   "sender_verification",
        "suspicious_urls":       "link_verification",
        "financial_requests":    "payment_verification",
        "attachment_requests":   "attachment_safety",
        # Previously missing 5 multi-channel threat types
        "qr_code_attacks":       "quishing_detection",
        "supply_chain_pretext":  "vendor_fraud_awareness",
        "cloud_app_consent":     "oauth_consent_defense",
        "mfa_fatigue":           "mfa_fatigue_defense",
        "vishing_dm_pretext":    "vishing_defense",
    }
    weaknesses = [
        weakness for indicator, weakness in mapping.items()
        if threat_indicators.get(indicator)
    ]
    if reasoning_classification.get("category") == "trust_based":
        weaknesses.append("trust_based_reasoning")
    if reasoning_classification.get("category") == "naive":
        weaknesses.append("security_reasoning")
    # Adversarial injection flag from classifier
    if reasoning_classification.get("adversarial"):
        weaknesses.append("adversarial_awareness")
    channel_weaknesses = {
        "cloud_oauth":    "oauth_consent_defense",
        "voice_phone":    "vishing_defense",
        "slack_teams":    "chat_compromise_defense",
        "qr_code":        "quishing_detection",
        "sms_push":       "mfa_fatigue_defense",
        "physical_media": "removable_media_defense",
    }
    if channel in channel_weaknesses:
        weaknesses.insert(0, channel_weaknesses[channel])
    return list(dict.fromkeys(weaknesses)) or ["verification_behavior"]


async def _save_evaluation_to_database(
    scenario_id: str,
    user_id: Optional[str],
    user_action: str,
    user_reasoning: str,
    evaluation_result: Dict[str, Any],
    threat_analysis: Dict[str, Any],
    channel: str = "email",
):
    """Save evaluation results to the decisions table."""
    try:
        # Create evaluation JSON for storage
        evaluation_json = {
            **evaluation_result,
            "threat_indicators": threat_analysis["indicators"],
            "safe_behavior": threat_analysis["safe_behavior"],
            "threat_knowledge": threat_analysis["threat_knowledge"],
            "reasoning_classification": threat_analysis["reasoning_classification"],
            "agent_trace": threat_analysis["agent_trace"],
            "channel": channel,
        }
        
        valid_user_id = user_id if (user_id and user_id != "anonymous" and len(user_id) > 20) else "11111111-1111-1111-1111-111111111111"
        valid_scenario_id = scenario_id if (scenario_id and len(scenario_id) > 20) else None
        
        # Insert into decisions table
        decision_data = {
            "user_id": valid_user_id,
            "scenario_id": valid_scenario_id,
            "chosen_action": user_action,
            "reasoning": user_reasoning,
            "evaluation": evaluation_json,
            "is_safe": evaluation_result["is_safe"],
            "human_review_required": threat_analysis["human_review_required"]
        }

        if supabase:
            supabase.table("decisions").insert(decision_data).execute()
            supabase.table("agent_audit_logs").insert({
                "agent_name": "EvaluationAgent (Member 2)",
                "user_id": valid_user_id,
                "action": "EVALUATE_DECISION",
                "details": {
                    "scenario_id": scenario_id,
                    "input": {"scenario_id": scenario_id, "user_action": user_action, "user_reasoning": user_reasoning},
                    "output": evaluation_json,
                    "human_review_required": threat_analysis["human_review_required"],
                    "agent_trace": threat_analysis["agent_trace"],
                },
            }).execute()
        save_decision(scenario_id, valid_user_id, decision_data)
        
    except Exception as e:
        print(f"Error saving to database: {e}")
        raise HTTPException(status_code=503, detail="Evaluation persistence failed") from e


@router.get("/health")
async def health_check():
    """Health check endpoint for the evaluation service."""
    return {"status": "healthy", "service": "evaluation_agent"}
