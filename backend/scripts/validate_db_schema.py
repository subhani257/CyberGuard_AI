"""Read-only Supabase schema and agent-persistence audit.

Run from backend with: python scripts/validate_db_schema.py
Only counts and missing field names are printed; learner content stays private.
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
if not url or not key or "your-project" in url:
    sys.exit("FAIL: Supabase is not configured")

db = create_client(url, key)
required = {
    "users": "id,email,full_name,role,company,access_role,readiness_score",
    "scenarios": "id,user_id,difficulty,target_role,threat_type,content,created_at",
    "decisions": "id,user_id,scenario_id,chosen_action,reasoning,evaluation,is_safe,human_review_required,created_at",
    "user_learning_profile": "user_id,next_difficulty,next_focus,tactic_to_target,target_channel,primary_attack_surface,training_map",
    "agent_audit_logs": "id,agent_name,user_id,action,details,created_at",
    "org_knowledge": "id,category,content,embedding,metadata",
    "cyber_threats": "id,category,source,content,embedding,metadata",
    "cyber_training": "id,category,channel,target_risk_surface,source,content,embedding,metadata",
}

failed = False
missing_by_table = {}
for table, columns in required.items():
    missing = []
    for column in columns.split(","):
        try:
            db.table(table).select(column).limit(1).execute()
        except Exception:
            missing.append(column)
    if missing:
        failed = True
        missing_by_table[table] = missing
        print(f"FAIL: {table} missing/unavailable columns: {', '.join(missing)}")
    else:
        print(f"OK: {table} columns")

def rows(table, columns):
    offset = 0
    while True:
        page = db.table(table).select(columns).range(offset, offset + 999).execute().data or []
        yield from page
        if len(page) < 1000:
            break
        offset += 1000


scenarios = list(rows("scenarios", "id,content"))
decisions = list(rows("decisions", "id,scenario_id,evaluation"))
profiles = list(rows("user_learning_profile", "user_id"))
audits = list(rows("agent_audit_logs", "action,details"))
scenario_ids = {row["id"] for row in scenarios}
scenario_channels = {row["id"]: (row.get("content") or {}).get("channel") for row in scenarios}
incomplete_decisions = sum(
    not ((row.get("evaluation") or {}).get("channel") or scenario_channels.get(row.get("scenario_id")))
    or not isinstance(row.get("evaluation"), dict)
    or not all(k in (row.get("evaluation") or {}) for k in
               ("final_score", "threat_indicators", "safe_behavior", "reasoning_classification", "agent_trace"))
    or row.get("scenario_id") not in scenario_ids
    for row in decisions
)
audit_actions = {"GENERATE_SCENARIO", "EVALUATE_DECISION", "UPDATE_LEARNING_PROFILE", "DYNAMIC_ONBOARDING_INITIALIZATION", "EXTRACT_ORG_POLICIES"}
audit_counts = {action: 0 for action in audit_actions}
incomplete_audits = 0
for row in audits:
    action = row.get("action")
    if action in audit_counts:
        audit_counts[action] += 1
        details = row.get("details") or {}
        fields = ("input", "output", "agent_trace")
        if action not in ("DYNAMIC_ONBOARDING_INITIALIZATION", "EXTRACT_ORG_POLICIES"):
            fields += ("scenario_id",)
        trace = details.get("agent_trace") if isinstance(details, dict) else None
        trace_complete = (
            isinstance(trace, list)
            and bool(trace)
            and all(isinstance(node, dict) and all(k in node for k in
                    (("execution_mode", "model_version") if action == "EXTRACT_ORG_POLICIES"
                     else ("execution_mode", "model_version", "llm_input", "llm_output"))) for node in trace)
        )
        if not isinstance(details, dict) or not all(k in details for k in fields) or not trace_complete:
            incomplete_audits += 1

print(f"Rows: scenarios={len(scenarios)} decisions={len(decisions)} profiles={len(profiles)} audits={len(audits)}")
print(f"Agent runs: {audit_counts}")
print(f"Incomplete records: decisions={incomplete_decisions} agent_runs={incomplete_audits}")
if incomplete_decisions or incomplete_audits:
    sys.exit(2)
if failed:
    sys.exit(1)
