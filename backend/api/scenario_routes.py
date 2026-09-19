import os
import uuid
import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from supabase import create_client, Client

from nlp.ner import sanitize_input
from rag.retrieval import get_org_context
from runtime_store import save_scenario, get_scenario as get_cached_scenario
from security.auth_bearer import get_current_user, CurrentUser
from graph.cyberguard_graph import scenario_graph  # ← LangGraph

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
    # Optional: specific attack channel from Training Arena
    channel: Optional[str] = None


@router.post("/generate-scenario")
def create_scenario(
    request: ScenarioRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Member 1 Core Endpoint (LangGraph):
    1. Retrieves organizational context via RAG (org_knowledge).
    2. Sanitizes context via spaCy NER to mask PII.
    3. Invokes the LangGraph scenario_graph → scenario_node (LangSmith traced).
    4. Persists the scenario in Supabase (public.scenarios) and returns scenario_id.
    """
    try:
        user_role = current_user.role
        difficulty = request.difficulty or "beginner"
        user_id = current_user.id
        company = current_user.company
        topic = request.topic
        channel = request.channel

        # Refresh role/company from DB in case onboarding updated them after JWT issuance
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

        # 1. Retrieve Org Context
        org_context = get_org_context(user_role, query=topic, company_name=company, user_id=user_id)

        # 2. Sanitize Context via spaCy PII filter
        safe_context = sanitize_input(org_context)

        scenario_id = str(uuid.uuid4())

        # 3. Run scenario_graph (LangGraph — LangSmith traces every LLM call automatically)
        graph_state = scenario_graph.invoke(
            {
                "user_id": user_id,
                "role": user_role,
                "difficulty": difficulty,
                "channel": channel,
                "topic": topic,
                "company": company,
                "org_context": safe_context,
                "agent_trace": [],
            },
            config={
                "configurable": {"thread_id": scenario_id},
                "tags": ["scenario_generation", f"user:{user_id}"],
                "metadata": {"user_id": user_id, "difficulty": difficulty},
            },
        )

        scenario_data = graph_state.get("scenario")
        if not isinstance(scenario_data, dict) or not isinstance(scenario_data.get("choices"), list) or len(scenario_data["choices"]) < 2:
            raise HTTPException(status_code=502, detail="Scenario Agent returned an invalid scenario")

        # 4. Save generated scenario to Supabase
        if supabase:
            try:
                db_record = {
                    "id": scenario_id,
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
                supabase.table("agent_audit_logs").insert({
                    "agent_name": "ScenarioAgent (Member 1)",
                    "user_id": user_id,
                    "action": "GENERATE_SCENARIO",
                    "details": {
                        "scenario_id": scenario_id,
                        "input": {"role": user_role, "difficulty": difficulty, "company": company,
                                  "topic": topic, "channel": channel, "org_context": safe_context},
                        "output": scenario_data,
                        "agent_trace": graph_state.get("agent_trace", []),
                    },
                }).execute()
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=503, detail=f"Scenario persistence failed: {e}")

        save_scenario(scenario_id, user_id, scenario_data)

        return {
            "status": "success",
            "scenario_id": scenario_id,
            "scenario": scenario_data,
            "org_context_applied": safe_context[:100] + "..." if safe_context else "",
            "agent_trace": graph_state.get("agent_trace", []),
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
        except Exception as e:
            raise HTTPException(status_code=503, detail="Scenario database retrieval failed") from e

        raise HTTPException(status_code=404, detail="Scenario not found")

    cached = get_cached_scenario(scenario_id, current_user.id)
    if cached:
        return {"status": "success", "scenario": cached}

    raise HTTPException(status_code=404, detail="Scenario not found")
