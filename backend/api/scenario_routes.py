import os
import uuid
import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

from agents.scenario_agent import generate_scenario
from nlp.ner import sanitize_input
from rag.retrieval import get_org_context

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

router = APIRouter(tags=["Scenario Generation (Member 1)"])

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Optional[Client] = None

try:
    if supabase_url and "your-project" not in supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"Notice: Supabase client in scenario_routes using local fallback: {e}")

# In-memory store for generated scenarios when offline or testing
MOCK_SCENARIOS_CACHE: Dict[str, Dict[str, Any]] = {}


class ScenarioRequest(BaseModel):
    user_id: Optional[str] = "11111111-1111-1111-1111-111111111111"
    role: Optional[str] = "Finance Manager"
    difficulty: Optional[str] = "beginner"
    company: Optional[str] = None
    # Optional: specific attack channel from Training Arena (e.g. voice_phone, email, slack_teams)
    channel: Optional[str] = None


@router.post("/generate-scenario")
def create_scenario(request: ScenarioRequest):
    """
    Member 1 Core Endpoint:
    1. Retrieves organizational context via RAG (org_knowledge).
    2. Sanitizes context via spaCy NER to mask PII.
    3. Calls Scenario Agent to generate realistic threat situation.
    4. Persists the scenario in Supabase (public.scenarios) and returns scenario_id.
    """
    try:
        user_role = request.role or "Finance Manager"
        difficulty = request.difficulty or "beginner"
        user_id = request.user_id or "11111111-1111-1111-1111-111111111111"
        company = request.company
        channel = request.channel  # e.g. "voice_phone", "email", "slack_teams"

        # 1. Retrieve Org Context (prioritizing custom company policy if uploaded)
        org_context = get_org_context(user_role, company_name=company, user_id=user_id)
        
        # 2. Sanitize Context via spaCy PII filter
        safe_context = sanitize_input(org_context)
        
        # 3. Generate Scenario via Scenario Agent (channel-aware when provided)
        scenario_json_str = generate_scenario(user_role, difficulty, safe_context, channel=channel)
        try:
            scenario_data = json.loads(scenario_json_str) if isinstance(scenario_json_str, str) else scenario_json_str
        except Exception:
            scenario_data = {"raw_content": scenario_json_str}

        scenario_id = str(uuid.uuid4())

        # 4. Save generated scenario to Supabase
        if supabase:
            try:
                db_record = {
                    "difficulty": difficulty,
                    "target_role": user_role,
                    "threat_type": scenario_data.get("threat_type", "Business Email Compromise"),
                    "content": scenario_data
                }
                res = supabase.table("scenarios").insert(db_record).execute()
                if res.data and len(res.data) > 0:
                    scenario_id = str(res.data[0]["id"])
            except Exception as e:
                print(f"Notice: Supabase scenario persistence bypassed: {e}")

        # Always cache locally
        MOCK_SCENARIOS_CACHE[scenario_id] = scenario_data

        return {
            "status": "success",
            "scenario_id": scenario_id,
            "scenario": scenario_data,
            "org_context_applied": safe_context[:100] + "..." if safe_context else ""
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    """Fetch an existing scenario by ID."""
    if supabase:
        try:
            res = supabase.table("scenarios").select("*").eq("id", scenario_id).execute()
            if res.data and len(res.data) > 0:
                return {"status": "success", "scenario": res.data[0]}
        except Exception:
            pass

    if scenario_id in MOCK_SCENARIOS_CACHE:
        return {"status": "success", "scenario": {"id": scenario_id, "content": MOCK_SCENARIOS_CACHE[scenario_id]}}

    raise HTTPException(status_code=404, detail="Scenario not found")
