from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import re
import time
from datetime import datetime

import os
from dotenv import load_dotenv
from supabase import create_client, Client

import sys
import importlib.util
from security.auth_bearer import get_current_user, CurrentUser
from runtime_store import get_scenario as get_cached_scenario, save_decision

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Direct file imports to avoid package issues
def import_module_from_file(module_name, file_path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module

# Import modules directly from files
nlp_dir = os.path.join(backend_dir, 'nlp')
agents_dir = os.path.join(backend_dir, 'agents')
rag_dir = os.path.join(backend_dir, 'rag')

threat_extractor_module = import_module_from_file('threat_extractor', os.path.join(nlp_dir, 'threat_extractor.py'))
ThreatExtractor = threat_extractor_module.ThreatExtractor

security_analysis_module = import_module_from_file('security_analysis', os.path.join(agents_dir, 'security_analysis.py'))
SecurityAnalyzer = security_analysis_module.SecurityAnalyzer

threat_retriever_module = import_module_from_file('threat_retriever', os.path.join(rag_dir, 'threat_retrieval.py'))
ThreatRetriever = threat_retriever_module.ThreatRetriever

classifier_module = import_module_from_file('classifier', os.path.join(nlp_dir, 'classifier.py'))
ReasoningClassifier = classifier_module.ReasoningClassifier

evaluation_agent_module = import_module_from_file('evaluation_agent', os.path.join(agents_dir, 'evaluation_agent.py'))
EvaluationAgent = evaluation_agent_module.EvaluationAgent

# Load .env from backend or project root
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

# Initialize components
threat_extractor = ThreatExtractor()
security_analyzer = SecurityAnalyzer()
threat_retriever = ThreatRetriever()
reasoning_classifier = ReasoningClassifier()
evaluation_agent = EvaluationAgent()

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
    scenario_id: str = Field(min_length=36, max_length=36)
    user_action: str = Field(min_length=1, max_length=500)
    user_reasoning: str = Field(min_length=1, max_length=1000)
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
        if supabase:
            try:
                scenario_data = (
                    supabase.table("scenarios")
                    .select("*")
                    .eq("id", request.scenario_id)
                    .eq("user_id", user_id)
                    .execute()
                )
                if scenario_data and scenario_data.data:
                    scenario_record = scenario_data.data[0]
            except Exception as e:
                print(f"Notice: Supabase scenario fetch bypassed: {e}")

        if not scenario_record:
            scenario_record = get_cached_scenario(request.scenario_id, user_id)
        if not scenario_record:
            raise HTTPException(status_code=404, detail="Scenario not found for authenticated user")

        scenario_content = scenario_record.get("content") or {}
        scenario_text = _extract_scenario_text(scenario_content)
        if not scenario_text:
            raise HTTPException(status_code=422, detail="Scenario has no evaluable content")

        choices = scenario_content.get("choices") or []
        if choices and not any(
            request.user_action.strip().casefold() == str(choice).strip().casefold()
            for choice in choices
        ):
            raise HTTPException(status_code=422, detail="Selected action is not one of this scenario's choices")
        
        # Step 2: Extract threat indicators
        threat_indicators_result = threat_extractor.extract(scenario_text)
        threat_indicators = threat_indicators_result["indicators"]
        
        # Step 3: Determine expected safe behavior
        safe_behavior = security_analyzer.determine_safe_behavior(threat_indicators)
        channel = str(scenario_content.get("channel") or "email")
        if not safe_behavior.get("detected_threats") and channel != "email":
            channel_actions = {
                "cloud_oauth": "Deny unverified app consent and confirm approved integrations with IT Security",
                "voice_phone": "End the call and verify through a known directory number",
                "slack_teams": "Verify the request using an authenticated internal ticket or second channel",
                "qr_code": "Do not scan the unverified QR code; inspect through an approved official channel",
                "sms_push": "Deny unexpected MFA prompts and report the attempts",
                "physical_media": "Do not plug in unknown media; hand it to security",
            }
            safe_behavior["expected_safe_action"] = channel_actions.get(channel, "Independently verify the request")
            safe_behavior["overall_risk"] = "high"
        
        # Step 4: Retrieve threat knowledge
        threat_knowledge = threat_retriever.retrieve(threat_indicators, channel=channel)
        
        # Step 5: Classify user reasoning
        reasoning_classification = reasoning_classifier.classify(request.user_reasoning)
        
        # Step 6: Evaluate decision
        evaluation_result = evaluation_agent.evaluate(
            user_action=request.user_action,
            user_reasoning=request.user_reasoning,
            expected_safe_behavior=safe_behavior,
            threat_indicators=threat_indicators,
            reasoning_classification=reasoning_classification
        )
        evaluation_result["weaknesses"] = _derive_weaknesses(
            threat_indicators,
            reasoning_classification,
            evaluation_result.get("is_safe", False),
            channel
        )
        
        # Step 7: Save to database
        await _save_evaluation_to_database(
            scenario_id=request.scenario_id,
            user_id=user_id,
            user_action=request.user_action,
            user_reasoning=request.user_reasoning,
            evaluation_result=evaluation_result,
            threat_analysis={
                "indicators": threat_indicators,
                "safe_behavior": safe_behavior,
                "threat_knowledge": threat_knowledge
            }
        )
        
        # Return combined results
        return EvaluationResponse(
            success=True,
            evaluation={
                "threat_analysis": {
                    "indicators": threat_indicators,
                    "safe_behavior": safe_behavior,
                    "threat_knowledge": threat_knowledge["threat_knowledge"],
                    "scenario_clues": scenario_content.get("clues_embedded", [])
                },
                "reasoning_analysis": reasoning_classification,
                "evaluation": evaluation_result
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
    """Extract all user-visible scenario text, including non-email channel data."""
    parts = []
    
    if "sender_name" in scenario_content:
        parts.append(f"From: {scenario_content['sender_name']}")
    if "sender_email" in scenario_content:
        parts.append(f"Email: {scenario_content['sender_email']}")
    if "subject" in scenario_content:
        parts.append(f"Subject: {scenario_content['subject']}")
    if "body" in scenario_content:
        parts.append(f"Body: {scenario_content['body']}")
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

    mapping = {
        "urgency_indicators": "urgency_bias",
        "authority_abuse": "authority_bias",
        "spoofed_domains": "sender_verification",
        "suspicious_urls": "link_verification",
        "financial_requests": "payment_verification",
        "attachment_requests": "attachment_safety",
    }
    weaknesses = [
        weakness for indicator, weakness in mapping.items()
        if threat_indicators.get(indicator)
    ]
    if reasoning_classification.get("category") == "trust_based":
        weaknesses.append("trust_based_reasoning")
    if reasoning_classification.get("category") == "naive":
        weaknesses.append("security_reasoning")
    channel_weaknesses = {
        "cloud_oauth": "oauth_consent_defense",
        "voice_phone": "vishing_defense",
        "slack_teams": "chat_compromise_defense",
        "qr_code": "quishing_detection",
        "sms_push": "mfa_fatigue_defense",
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
    threat_analysis: Dict[str, Any]
):
    """Save evaluation results to the decisions table."""
    try:
        # Create evaluation JSON for storage
        evaluation_json = {
            "action_score": evaluation_result["action_score"],
            "reasoning_score": evaluation_result["reasoning_score"],
            "final_score": evaluation_result["final_score"],
            "threat_indicators": threat_analysis["indicators"],
            "safe_behavior": threat_analysis["safe_behavior"],
            "reasoning_category": threat_analysis.get("reasoning_category", "N/A"),
            "llm_evaluation": evaluation_result["llm_evaluation"],
            "weaknesses": evaluation_result.get("weaknesses", [])
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
            "human_review_required": evaluation_result["human_review_required"]
        }

        # Preserve the exact result for the offline demo even when no database is configured.
        save_decision(scenario_id, valid_user_id, decision_data)
        if supabase:
            supabase.table("decisions").insert(decision_data).execute()
        
    except Exception as e:
        print(f"Error saving to database: {e}")
        # Don't fail the whole evaluation if database save fails
        pass


@router.get("/health")
async def health_check():
    """Health check endpoint for the evaluation service."""
    return {"status": "healthy", "service": "evaluation_agent"}
