from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlp.threat_extractor import ThreatExtractor
from agents.security_analysis import SecurityAnalyzer
from rag.threat_retrieval import ThreatRetriever
from nlp.classifier import ReasoningClassifier
from agents.evaluation_agent import EvaluationAgent

# Load .env from project root (backend directory is subdirectory)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

router = APIRouter()

# Initialize components
threat_extractor = ThreatExtractor()
security_analyzer = SecurityAnalyzer()
threat_retriever = ThreatRetriever()
reasoning_classifier = ReasoningClassifier()
evaluation_agent = EvaluationAgent()

# Initialize Supabase
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


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
async def evaluate_decision(request: EvaluationRequest):
    """
    Unified evaluation endpoint that performs security analysis and decision evaluation.
    
    Process:
    1. Extract threat indicators from scenario
    2. Determine expected safe behavior
    3. Retrieve threat knowledge from RAG
    4. Classify user reasoning
    5. Apply scoring rubric
    6. Get LLM evaluation
    7. Save results to database
    """
    try:
        # Step 1: Get scenario content from database
        scenario_data = supabase.table("scenarios").select("*").eq("id", request.scenario_id).execute()
        
        if not scenario_data.data:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
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
        
        # Insert into decisions table
        decision_data = {
            "user_id": user_id,
            "scenario_id": scenario_id,
            "chosen_action": user_action,
            "reasoning": user_reasoning,
            "evaluation": evaluation_json,
            "is_safe": evaluation_result["is_safe"],
            "human_review_required": evaluation_result["human_review_required"]
        }
        
        supabase.table("decisions").insert(decision_data).execute()
        
    except Exception as e:
        print(f"Error saving to database: {e}")
        # Don't fail the whole evaluation if database save fails
        pass


@router.get("/health")
async def health_check():
    """Health check endpoint for the evaluation service."""
    return {"status": "healthy", "service": "evaluation_agent"}
