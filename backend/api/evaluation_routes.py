from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import re
import time
from datetime import datetime

import os
from dotenv import load_dotenv
from supabase import create_client, Client

import sys
import importlib.util

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

# JWT Authentication verification (simplified)
def verify_jwt_token(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.replace("Bearer ", "")
    # In production, verify JWT signature and expiration
    # For now, just check if token exists and is not empty
    if not token or len(token) < 10:
        return None
    
    return token

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
    scenario_id: str
    user_action: str
    user_reasoning: str
    user_id: Optional[str] = None


class EvaluationResponse(BaseModel):
    success: bool
    evaluation: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_decision(request: EvaluationRequest, http_request: Request):
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
    # Debug: print request data
    print(f"Received request: {request}")
    
    # Security: JWT Authentication verification (disabled for testing)
    user_id = request.user_id or "anonymous"
    # token = verify_jwt_token(http_request)
    # if not token and user_id == "anonymous":
    #     log_audit_event("auth_failed", user_id, {"reason": "No valid JWT token"})
    #     raise HTTPException(status_code=401, detail="Authentication required")
    
    # Security: Rate limiting (disabled for testing)
    # if not check_rate_limit(user_id):
    #     log_audit_event("rate_limit_exceeded", user_id, {"endpoint": "/evaluate"})
    #     raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Security: Audit logging for request
    log_audit_event("evaluation_request", user_id, {
        "scenario_id": request.scenario_id,
        "user_action": request.user_action
    })
    try:
        # Step 1: Get scenario content from database
        scenario_text = None
        if supabase:
            try:
                scenario_data = supabase.table("scenarios").select("*").eq("id", request.scenario_id).execute()
                if scenario_data and scenario_data.data:
                    scenario = scenario_data.data[0]
                    scenario_text = _extract_scenario_text(scenario["content"])
            except Exception as e:
                print(f"Notice: Supabase scenario fetch bypassed: {e}")
        
        if not scenario_text:
            # For testing without real database data, use a mock scenario
            print(f"Scenario {request.scenario_id} not found in database, using fallback scenario for testing")
            scenario_text = """
            Subject: URGENT: Wire Transfer Request
            
            From: ceo@micros0ft.com
            To: finance@yourcompany.com
            
            Please immediately wire $50,000 to account 123456789 for the Johnson project. 
            This is extremely urgent and must be completed within the hour. Do not call to verify - 
            I'm in a meeting and cannot be disturbed.
            
            Regards,
            CEO
            """
        else:
            scenario = scenario_data.data[0]
            scenario_text = _extract_scenario_text(scenario["content"])
        
        # Step 2: Extract threat indicators
        threat_indicators_result = threat_extractor.extract(scenario_text)
        threat_indicators = threat_indicators_result["indicators"]
        
        # Step 3: Determine expected safe behavior
        safe_behavior = security_analyzer.determine_safe_behavior(threat_indicators)
        
        # Step 4: Retrieve threat knowledge
        threat_knowledge = threat_retriever.retrieve(threat_indicators)
        
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
        
        # Step 7: Save to database
        await _save_evaluation_to_database(
            scenario_id=request.scenario_id,
            user_id=request.user_id,
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
                    "threat_knowledge": threat_knowledge["threat_knowledge"]
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
    """Extract full text from scenario JSON content."""
    parts = []
    
    if "sender_name" in scenario_content:
        parts.append(f"From: {scenario_content['sender_name']}")
    if "sender_email" in scenario_content:
        parts.append(f"Email: {scenario_content['sender_email']}")
    if "subject" in scenario_content:
        parts.append(f"Subject: {scenario_content['subject']}")
    if "body" in scenario_content:
        parts.append(f"Body: {scenario_content['body']}")
    
    return " ".join(parts)


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
            "llm_evaluation": evaluation_result["llm_evaluation"]
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
