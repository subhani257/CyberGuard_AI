import os
import uuid
import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from supabase import create_client, Client

from agents.scenario_agent import generate_scenario
from nlp.ner import sanitize_input
from rag.retrieval import get_org_context
from runtime_store import save_scenario, get_scenario as get_cached_scenario
from security.auth_bearer import get_current_user, CurrentUser

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

class ScenarioRequest(BaseModel):
    # Kept for backward-compatible clients; identity always comes from JWT.
    user_id: Optional[str] = None
    role: Optional[str] = None
    difficulty: Optional[str] = Field(default=None, pattern="^(beginner|medium|advanced)$")
    company: Optional[str] = None
    topic: Optional[str] = Field(default=None, max_length=120)
    # Optional: specific attack channel from Training Arena (e.g. voice_phone, email, slack_teams)
    channel: Optional[str] = None


@router.post("/generate-scenario")
def create_scenario(
    request: ScenarioRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Member 1 Core Endpoint:
    1. Retrieves organizational context via RAG (org_knowledge).
    2. Sanitizes context via spaCy NER to mask PII.
    3. Calls Scenario Agent to generate realistic threat situation.
    4. Persists the scenario in Supabase (public.scenarios) and returns scenario_id.
    """
    try:
        user_role = current_user.role
        difficulty = request.difficulty or "beginner"
        user_id = current_user.id
        company = current_user.company
        topic = request.topic
        channel = request.channel  # e.g. "voice_phone", "email", "slack_teams"

        # Onboarding can update a learner's role and organization after the JWT
        # was issued. Prefer the current server-side profile so personalization
        # does not remain stuck on the signup defaults until the next login.
        if supabase:
            try:
                user_res = (
                    supabase.table("users")
                    .select("role,company")
                    .eq("id", user_id)
                    .limit(1)
                    .execute()
                )
                if user_res.data:
                    user_role = user_res.data[0].get("role") or user_role
                    company = user_res.data[0].get("company") or company
            except Exception as e:
                print(f"Notice: Supabase user profile fetch in create_scenario: {e}")

        # 1. Retrieve Org Context (prioritizing custom company policy if uploaded)
        org_context = get_org_context(user_role, query=topic, company_name=company, user_id=user_id)
        
        # 2. Sanitize Context via spaCy PII filter
        safe_context = sanitize_input(org_context)
        
        # 3. Generate Scenario via Scenario Agent (channel-aware when provided)
        scenario_json_str = generate_scenario(user_role, difficulty, safe_context, channel=channel, topic=topic)
        try:
            scenario_data = json.loads(scenario_json_str) if isinstance(scenario_json_str, str) else scenario_json_str
        except Exception:
            raise HTTPException(status_code=502, detail="Scenario Agent returned invalid JSON")
        if not isinstance(scenario_data, dict) or not isinstance(scenario_data.get("choices"), list) or len(scenario_data["choices"]) < 2:
            raise HTTPException(status_code=502, detail="Scenario Agent returned an invalid scenario")

        scenario_id = str(uuid.uuid4())

        # 4. Save generated scenario to Supabase
        if supabase:
            try:
                db_record = {
                    "user_id": user_id,
                    "difficulty": difficulty,
                    "target_role": user_role,
                    "threat_type": scenario_data.get("threat_type", "Business Email Compromise"),
                    "content": scenario_data
                }
                res = supabase.table("scenarios").insert(db_record).execute()
                if res.data and len(res.data) > 0:
                    scenario_id = str(res.data[0]["id"])
                else:
                    raise HTTPException(status_code=503, detail="Scenario persistence returned no record")
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=503, detail=f"Scenario persistence failed: {e}")

        save_scenario(scenario_id, user_id, scenario_data)

        return {
            "status": "success",
            "scenario_id": scenario_id,
            "scenario": scenario_data,
            "org_context_applied": safe_context[:100] + "..." if safe_context else ""
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios/{scenario_id}")
def get_scenario(
    scenario_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Fetch an existing scenario by ID."""
    if supabase:
        try:
            res = supabase.table("scenarios").select("*").eq("id", scenario_id).eq("user_id", current_user.id).execute()
            if res.data and len(res.data) > 0:
                return {"status": "success", "scenario": res.data[0]}
        except Exception:
            pass

    cached = get_cached_scenario(scenario_id, current_user.id)
    if cached:
        return {"status": "success", "scenario": cached}

    raise HTTPException(status_code=404, detail="Scenario not found")
