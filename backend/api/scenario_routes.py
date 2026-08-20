from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.scenario_agent import generate_scenario
from nlp.ner import sanitize_input
from rag.retrieval import get_org_context

router = APIRouter()

class ScenarioRequest(BaseModel):
    user_id: str
    role: str
    difficulty: str

@router.post("/generate-scenario")
def create_scenario(request: ScenarioRequest):
    try:
        # 1. Retrieve Org Context
        org_context = get_org_context(request.role)
        
        # 2. Sanitize Context (if there was user input containing PII, we'd sanitize here)
        safe_context = sanitize_input(org_context)
        
        # 3. Generate Scenario via Groq
        scenario_json_str = generate_scenario(request.role, request.difficulty, safe_context)
        
        # 4. In production, we'd save to Supabase here
        
        return {"status": "success", "scenario": scenario_json_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
