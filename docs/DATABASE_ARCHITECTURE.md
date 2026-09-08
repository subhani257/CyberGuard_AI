# CyberGuard AI — Database Architecture Explained

> Every table, every agent output, and how the full system is tracked end-to-end.

---

## The Big Picture

CyberGuard AI has **3 AI agents**, each with specific jobs, and **every single action they take is written to the database**. The database has 8 tables total, split into 3 layers:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: CORE TABLES                                   │
│  users · scenarios · decisions                          │
├─────────────────────────────────────────────────────────┤
│  LAYER 2: KNOWLEDGE BASE (RAG / pgvector)               │
│  org_knowledge · cyber_threats · cyber_training         │
├─────────────────────────────────────────────────────────┤
│  LAYER 3: AGENT STATE + AUDIT                           │
│  user_learning_profile · agent_audit_logs               │
└─────────────────────────────────────────────────────────┘
```

---

## LAYER 1 — Core Tables

### `users`

Stores the registered employees (trainees) using the platform.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID (PK) | Unique user ID, auto-generated |
| `email` | TEXT | The user's work email |
| `full_name` | TEXT | Display name |
| `role` | TEXT | Their job role (e.g. "Finance Manager") |
| `readiness_score` | INTEGER | Tracks their cybersecurity readiness 0–100 |
| `created_at` | TIMESTAMP | Account creation time |

> **Who writes here?** Auth trigger (when user signs up) + Coach Agent (updates `readiness_score` after every session).

---

### `scenarios`

Every AI-generated situation (the email the user must respond to) is stored here.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID (PK) | Unique scenario ID |
| `difficulty` | TEXT | `beginner`, `medium`, `advanced` |
| `target_role` | TEXT | The role this scenario targets (e.g. "HR Officer") |
| `threat_type` | TEXT | Type of attack (e.g. `BEC`, `Phishing`, `Smishing`) |
| `content` | JSONB | Full structured email object (see example below) |
| `created_at` | TIMESTAMP | When the scenario was generated |

**Example** `content` **JSON:**

```json
{
  "sender_name": "David Chen",
  "sender_email": "ceo@novatech-global.com",
  "subject": "Urgent Wire Transfer — Confidential",
  "body": "I need you to process this payment immediately...",
  "red_flags": ["urgency", "secrecy", "domain_spoofing"]
}
```

> **Who writes here?** ✅ **Scenario Agent** — Every time it generates a new situation for a user.

---

### `decisions`

The heart of the system. Every time a user reads a scenario and submits their response, it is saved here. The Evaluation Agent then writes its verdict back into this same row.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID (PK) | Unique decision ID |
| `user_id` | UUID (FK → users) | Links to the user who made the decision |
| `scenario_id` | UUID (FK → scenarios) | Links to the scenario they were responding to |
| `chosen_action` | TEXT | The option they picked (e.g. "Ignored the email") |
| `reasoning` | TEXT | The free-text explanation they typed |
| `evaluation` | JSONB | The Evaluation Agent's full verdict (see below) |
| `is_safe` | BOOLEAN | Was their decision correct? `true` / `false` |
| `human_review_required` | BOOLEAN | ⚠️ RAI flag — set to `true` if the AI is not confident |
| `created_at` | TIMESTAMP | When the decision was submitted |

**Example** `evaluation` **JSON (written by Evaluation Agent):**

```json
{
  "confidence": 54,
  "reason_for_escalation": "Conflicting behavioral signals",
  "noticed_clues": ["Urgency", "Unknown sender domain"],
  "missed_clues": ["Replied directly to the attacker"],
  "pattern": "Business Email Compromise (BEC)",
  "coach_feedback": "You correctly spotted urgency, but replying confirmed your email is active."
}
```

> **Who writes here?**
>
> - **User (via frontend)** — Writes `chosen_action` and `reasoning`
> - ✅ **Evaluation Agent** — Writes back `evaluation`, `is_safe`, `human_review_required`

---

## LAYER 2 — Knowledge Bases (RAG / pgvector)

Each knowledge base is a **separate isolated table** with a `vector(1536)` embedding column. This is what allows agents to do semantic search — asking "what policy is relevant here?" and getting back the closest matching documents.

### `org_knowledge` — Owned by Scenario Agent

Stores company-specific knowledge about NovaTech (the simulated company).

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID (PK) | Unique row ID |
| `category` | TEXT | Type: `policy`, `workflow`, `hierarchy` |
| `content` | TEXT | The raw policy/procedure text |
| `embedding` | vector(1536) | OpenAI-generated vector for semantic search |
| `metadata` | JSONB | Source document name, department, page number |

**Example content:** `"FIN-SEC-04: All wire transfers over $10,000 require verbal confirmation."`

> **Who reads here?** ✅ **Scenario Agent** — before generating a scenario, it queries this table: *"What company policies are relevant to a Finance Manager?"* so the scenario feels realistic and grounded.

---

### `cyber_threats` — Owned by Evaluation Agent

Stores real-world threat intelligence from CISA, FBI IC3, NIST.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID (PK) | Unique row ID |
| `category` | TEXT | `threat_definition`, `attack_pattern`, `incident_report` |
| `source` | TEXT | The agency source (e.g. `"FBI IC3"`) |
| `content` | TEXT | The threat description text |
| `embedding` | vector(1536) | Vector for semantic search |
| `metadata` | JSONB | Source URL, publication date |

**Example content:** `"BEC losses reached $3.04 billion in 2024. Indicators include high urgency and demands for secrecy."`

> **Who reads here?** ✅ **Evaluation Agent** — after a user submits a decision, it queries: *"What threat patterns match what just happened?"* to give an accurate, evidence-backed evaluation.

---

### `cyber_training` — Owned by Coach Agent

Stores pedagogical guidance from SANS, NIST SP 800-50, CISA training frameworks.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID (PK) | Unique row ID |
| `category` | TEXT | `best_practice`, `behavioral_guidance`, `awareness_tip` |
| `source` | TEXT | e.g. `"NIST SP 800-50"`, `"CISA"` |
| `content` | TEXT | The guidance text |
| `embedding` | vector(1536) | Vector for semantic search |
| `metadata` | JSONB | Framework citations |

**Example content:** `"Do not shame users. Explain *why* the lure worked and show the exact missed clue."`

> **Who reads here?** ✅ **Coach Agent** — after evaluation, it queries: *"What training guidance fits this user's mistake?"* to craft a personalized, non-judgmental coaching message.

---

## LAYER 3 — Agent State & Audit

### `user_learning_profile` — Written by Coach Agent

This is the **Coach Agent's long-term memory** for each user. After every session, the Coach Agent updates this row to plan the user's next challenge.

| Column | Type | Purpose |
| --- | --- | --- |
| `user_id` | UUID (PK, FK → users) | One profile per user |
| `next_difficulty` | TEXT | What difficulty to give next: `beginner`, `medium`, `advanced` |
| `next_focus` | TEXT | What attack type to focus on next (e.g. `"phishing"`) |
| `avoid_type` | TEXT | What scenario type to avoid (user already mastered this) |
| `tactic_to_target` | TEXT | The specific cognitive tactic to train (e.g. `"urgency+authority"`) |
| `updated_at` | TIMESTAMP | When the Coach Agent last updated the profile |

> **Who writes here?** ✅ **Coach Agent** — after every completed session. This drives the adaptive learning loop, making each user's journey unique.

---

### `agent_audit_logs` — Responsible AI (RAI) Traceability

Every single action taken by any AI agent is logged here. This is what proves to your evaluators that CyberGuard AI is a **responsible, auditable, and explainable AI system**.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID (PK) | Unique log entry |
| `agent_name` | TEXT | Which agent did this: `scenario_agent`, `evaluation_agent`, `coach_agent` |
| `user_id` | UUID (FK → users) | Which user this action relates to |
| `action` | TEXT | What the agent did (e.g. `"generated_scenario"`, `"evaluated_decision"`) |
| `model_version` | TEXT | Exact OpenAI model used (e.g. `"gpt-4o-mini-2024-07-18"`) — RAI |
| `prompt_version` | TEXT | Which prompt template was used (e.g. `"v2.1"`) — RAI |
| `details` | JSONB | Full input/output payload for the AI call |
| `created_at` | TIMESTAMP | Exact timestamp of the action |

> **Who writes here?** ✅ **ALL 3 agents** — every time they run. No AI action goes unlogged.

---

## Full Flow — What Gets Written When

```
User Visits Dashboard
        │
        ▼
Scenario Agent runs
  ├─ READS  →  org_knowledge (RAG search for relevant policies)
  ├─ WRITES →  scenarios (saves the generated email)
  └─ WRITES →  agent_audit_logs (logs the generation event)
        │
        ▼
User reads the email, picks an action, types reasoning
  └─ WRITES →  decisions (user_id, scenario_id, chosen_action, reasoning)
        │
        ▼
Evaluation Agent runs
  ├─ READS  →  decisions (gets the user's response)
  ├─ READS  →  cyber_threats (RAG search: "what attack pattern is this?")
  ├─ WRITES →  decisions (fills in: evaluation, is_safe, human_review_required)
  └─ WRITES →  agent_audit_logs (logs the evaluation event)
        │
        ▼
Coach Agent runs
  ├─ READS  →  decisions (gets the evaluation)
  ├─ READS  →  user_learning_profile (reads the user's history)
  ├─ READS  →  cyber_training (RAG search: "what coaching fits this mistake?")
  ├─ WRITES →  user_learning_profile (updates: next_difficulty, next_focus, etc.)
  ├─ WRITES →  users.readiness_score (updates the user's overall score)
  └─ WRITES →  agent_audit_logs (logs the coaching event)
        │
        ▼
Human Review Queue (Admin Dashboard)
  └─ READS  →  decisions WHERE human_review_required = true
               Operator clicks "Confirm AI" or "Override"
               (Future: this feeds back into training data)
```

---

## Security: Who Can Access What?

Row Level Security (RLS) is enabled on **every table**. The access rules are:

| Table | Regular User (Frontend) | Backend (service_role key) |
| --- | --- | --- |
| `users` | Can only see their own row | Full access |
| `scenarios` | Can read all (public) | Full access |
| `decisions` | Can only read/write their own | Full access |
| `user_learning_profile` | Can only read their own | Full access (writes) |
| `org_knowledge` | ❌ No access | Full access |
| `cyber_threats` | ❌ No access | Full access |
| `cyber_training` | ❌ No access | Full access |
| `agent_audit_logs` | ❌ No access | Full access |

> The 3 RAG knowledge bases and the audit logs are **completely invisible** to the frontend. Only your FastAPI backend (using the Supabase `service_role` key) can touch them. This is how we protect sensitive threat intelligence and maintain audit integrity.