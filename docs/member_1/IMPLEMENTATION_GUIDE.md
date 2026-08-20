# 👤 Member 1 Implementation Guide — Scenario Generation & Personalization

As **Member 1**, you own the **beginning** of the pipeline. Your job is to build the system that creates hyper-realistic cybersecurity scenarios using the Groq API (LLM) and organizational RAG.

**Your Core Identity for the Viva:** *"I build the system that creates realistic cybersecurity situations."*

---

## 🛠️ Your Tech Stack Focus
*   **LLM:** Groq API (Llama 3) — *We are using Groq for free, lightning-fast inference.*
*   **NLP:** spaCy (for entity extraction and input sanitization/PII masking).
*   **Database:** Supabase PostgreSQL (`scenarios` table) & pgvector (`org_knowledge`).
*   **Backend:** FastAPI (`/api/scenario/generate` endpoint).
*   **Frontend:** React/Next.js (The "Context Card" UI).

---

## 📋 Step-by-Step Implementation Plan for Member 1

### Step 1: Set Up the Groq LLM Integration (AI / Agent)
Because we are using Groq, you need to write the Python function that calls the Groq API. The Groq SDK is almost identical to the OpenAI SDK.
*   **Task:** Create `backend/agents/scenario_agent.py`.
*   **Logic:** Write a system prompt that takes parameters like `user_role`, `difficulty`, and `threat_type`, and instructs the Groq model to output a JSON object containing the scenario text and multiple-choice actions.
*   *Responsible AI check:* Ensure the prompt strictly forbids generating actual malicious links.

### Step 2: Implement Input Sanitization (NLP / Security)
Before you generate a scenario based on an organization's internal data, you must ensure no real employee PII is leaked to Groq.
*   **Task:** Create `backend/nlp/ner.py`.
*   **Logic:** Load a basic `spaCy` model (e.g., `en_core_web_sm`). Write a function `sanitize_input(text)` that replaces entities like `PERSON` or `EMAIL` with generic tags like `[MASKED_NAME]`.

### Step 3: Organizational RAG (Information Retrieval)
To make your scenarios realistic, you need to pull the specific company workflows from the database.
*   **Task:** Create the retrieval logic in `backend/rag/retrieval.py` (specifically for `org_knowledge`).
*   **Logic:** Query Supabase `pgvector` to find 2-3 chunks of organizational context related to the user's role (e.g., pulling NovaTech's wire transfer approval process for a Finance Manager). 
*   Pass this retrieved text into your Groq prompt from Step 1.

### Step 4: The FastAPI Endpoint (API / Backend)
Tie it all together so the frontend can request a scenario.
*   **Task:** Create `backend/api/scenario_routes.py`.
*   **Logic:** Build a `POST /generate-scenario` endpoint. 
    *   *Input:* `user_id`
    *   *Process:* Look up user's role/difficulty in Supabase -> Run RAG -> Call Groq -> Save generated scenario to the `scenarios` PostgreSQL table.
    *   *Output:* Return the JSON scenario to the frontend.

### Step 5: The "Context Card" (Frontend)
Build the UI that displays what you generated.
*   **Task:** Create `frontend/components/ScenarioCard.tsx`.
*   **Logic:** A clean React component that displays the scenario text (e.g., formatted like an email) and renders the action buttons. When the user clicks an action, a text box must appear asking *"Why did you choose this?"* (This captures the reasoning to hand off to Member 2).

---

## 🎯 How to Prove Your Contribution (Git Evidence)
To ensure you get full marks for the Balanced Contribution Model, make sure you commit the following files from your own GitHub account:

1.  `git commit -m "feat(agent): implement Groq API for scenario generation"`
2.  `git commit -m "feat(nlp): add spaCy PII masking for sanitization"`
3.  `git commit -m "feat(rag): implement org_knowledge vector retrieval"`
4.  `git commit -m "feat(api): create /generate-scenario FastAPI endpoint"`
5.  `git commit -m "feat(ui): build responsive Context Card component"`

---

## 💡 Using Groq (Quick Code Example for your Agent)
Since we switched to Groq, here is the basic structure you will use in `scenario_agent.py`:

```python
import os
from groq import Groq

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def generate_scenario(role: str, difficulty: str, org_context: str) -> str:
    prompt = f"""
    You are a cybersecurity training simulator.
    Generate a {difficulty} phishing scenario for a {role}.
    Make it realistic by incorporating this company context: {org_context}
    Output ONLY in JSON format with keys: 'scenario_text', 'choices', 'threat_type'.
    """
    
    response = client.chat.completions.create(
        messages=[{"role": "system", "content": prompt}],
        model="llama3-8b-8192", # Free, fast Groq model
        response_format={"type": "json_object"}
    )
    
    return response.choices[0].message.content
```
