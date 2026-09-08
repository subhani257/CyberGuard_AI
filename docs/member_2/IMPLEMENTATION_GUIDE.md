# 👤 Member 2 Implementation Guide — Decision Evaluation & Analysis

As **Member 2**, you own the **middle** of the pipeline. Your job is to build a unified agent that performs security analysis first, then evaluates the user's decision and reasoning using NLP classification and threat knowledge RAG.

**Your Core Identity for the Viva:** *"I build the system that analyzes threats and evaluates user decisions fairly."*

---

## 🛠️ Your Tech Stack Focus
*   **LLM:** OpenAI API (GPT-4o) — *Used for advanced reasoning evaluation.*
*   **NLP:** spaCy (for threat indicator extraction and text classification).
*   **Database:** Supabase PostgreSQL (`responses`, `results` tables) & pgvector (`cyber_threats`).
*   **Backend:** FastAPI (`/api/agents/evaluate` endpoint).
*   **Frontend:** React/Next.js (The Evaluation Results UI).

---

## 📋 Step-by-Step Implementation Plan for Member 2

### Phase 1: Security Analysis Agent (Part 1 of Unified Agent)

#### Step 1: Implement Threat Indicator Extraction (NLP / Security)
Before evaluating the user's decision, you need to identify what threats exist in the scenario.
*   **Task:** Create `backend/nlp/threat_extractor.py`.
*   **Logic:** Load spaCy model and write functions to extract:
    *   Spoofed domains (e.g., `support@micros0ft.com` instead of `microsoft.com`)
    *   Financial requests (keywords: "wire transfer", "invoice", "payment")
    *   Urgency indicators (keywords: "immediately", "urgent", "asap")
    *   Authority abuse (CEO names, manager references)
*   **Output:** Structured JSON with detected threat types and confidence scores.

#### Step 2: Define Expected Safe Behavior (Security Analysis)
Based on the extracted threats, determine what the safe response should be.
*   **Task:** Create `backend/agents/security_analysis.py`.
*   **Logic:** Build a rule-based system that maps threat types to safe behaviors:
    *   Spoofed domain → "Verify sender identity through alternate channel"
    *   Financial request → "Confirm with finance department"
    *   Urgency → "Slow down, verify legitimacy"
*   **Output:** Expected safe action and reasoning.

#### Step 3: Threat Knowledge RAG (Information Retrieval)
To ground your analysis in real cybersecurity knowledge.
*   **Task:** Create retrieval logic in `backend/rag/threat_retrieval.py`.
*   **Logic:** Query Supabase `pgvector` `cyber_threats` table to find relevant threat patterns and mitigation strategies.
*   **Output:** Context about similar threat types and standard defenses.

---

### Phase 2: Decision Evaluation Agent (Part 2 of Unified Agent)

#### Step 4: User Reasoning Classification (NLP / Classification)
Classify the user's written reasoning to understand their thought process.
*   **Task:** Create `backend/nlp/classifier.py`.
*   **Logic:** Use spaCy or a simple ML classifier to categorize reasoning:
    *   Security-aware (mentions verification, checking sources)
    *   Trust-based (mentions authority, urgency)
    *   Naive (no security considerations)
*   **Output:** Reasoning category and confidence score.

#### Step 5: Scoring Rubric Implementation (AI / Agent)
Create a fair, consistent scoring system based on the security analysis.
*   **Task:** Create `backend/agents/evaluation_agent.py`.
*   **Logic:** Implement a strict rubric that scores based on:
    *   **Action Score (0-100):** Did they choose the safe action?
    *   **Reasoning Score (0-100):** Did their reasoning show security awareness?
    *   **Final Score:** Weighted combination (e.g., 60% action, 40% reasoning)
*   **Fairness Check:** Ensure scoring doesn't consider job title, only behavior.

#### Step 6: LLM-Based Reasoning Evaluation (AI / Agent)
Use OpenAI API for nuanced evaluation of user reasoning.
*   **Task:** Extend `backend/agents/evaluation_agent.py`.
*   **Logic:** Call OpenAI with a strict prompt that:
    *   Takes user's action, reasoning, and threat indicators
    *   Outputs structured JSON with score breakdown and explanation
    *   Is forbidden from making assumptions about user identity
*   **Responsible AI:** Treat user reasoning as data, never as instructions.

---

### Phase 3: Integration & API

#### Step 7: The Unified FastAPI Endpoint (API / Backend)
Combine security analysis and evaluation into one cohesive endpoint.
*   **Task:** Create `backend/api/evaluation_routes.py`.
*   **Logic:** Build `POST /api/agents/evaluate` endpoint:
    *   *Input:* `scenario_id`, `user_action`, `user_reasoning`
    *   *Process:*
        1. Run threat extraction (Step 1)
        2. Determine expected safe behavior (Step 2)
        3. Retrieve threat knowledge (Step 3)
        4. Classify user reasoning (Step 4)
        5. Apply scoring rubric (Step 5)
        6. Get LLM evaluation (Step 6)
        7. Save results to PostgreSQL `responses` and `results` tables
    *   *Output:* JSON with scores, threat analysis, and explanation

#### Step 8: API Security (Security Focus)
Ensure secure communication between agents.
*   **Task:** Implement security measures in `backend/api/evaluation_routes.py`.
*   **Logic:**
    *   Input validation and sanitization
    *   Rate limiting
    *   JWT authentication verification
    *   Audit logging for all evaluations

---

### Phase 4: Frontend & Testing

#### Step 9: Evaluation Results UI (Frontend)
Build the interface that shows the user their evaluation results.
*   **Task:** Create `frontend/components/EvaluationResults.tsx`.
*   **Logic:** Display:
    *   Overall score with visual indicator
    *   Threat indicators found in the scenario
    *   Action vs. expected safe behavior
    *   Reasoning analysis
    *   Detailed explanation from the agent
*   **UX:** Clear, educational feedback (not just pass/fail)

#### Step 10: Testing (Testing Focus)
Ensure scoring consistency and handle adversarial inputs.
*   **Task:** Create `backend/tests/test_evaluation_agent.py`.
*   **Logic:** Test cases for:
    *   Scoring consistency (same input → same score)
    *   Adversarial reasoning (prompt injection attempts)
    *   Edge cases (empty reasoning, malicious input)
    *   Fairness (different job titles, same behavior → same score)

---

## 🎯 How to Prove Your Contribution (Git Evidence)
To ensure you get full marks for the Balanced Contribution Model, make sure you commit the following files from your own GitHub account:

1.  `git commit -m "feat(nlp): implement threat indicator extraction with spaCy"`
2.  `git commit -m "feat(agent): build security analysis module for threat detection"`
3.  `git commit -m "feat(rag): implement cyber_threats vector retrieval"`
4.  `git commit -m "feat(nlp): add user reasoning classification system"`
5.  `git commit -m "feat(agent): implement scoring rubric for fair evaluation"`
6.  `git commit -m "feat(agent): integrate OpenAI API for reasoning evaluation"`
7.  `git commit -m "feat(api): create unified /evaluate endpoint with security"`
8.  `git commit -m "feat(ui): build evaluation results display component"`
9.  `git commit -m "test(evaluation): add scoring consistency and adversarial tests"`

---

## 💡 Unified Agent Architecture (Your Implementation)

Your agent combines security analysis and evaluation in sequence:

```python
# backend/agents/unified_evaluation_agent.py

class UnifiedEvaluationAgent:
    def __init__(self):
        self.threat_extractor = ThreatExtractor()
        self.security_analyzer = SecurityAnalyzer()
        self.threat_retriever = ThreatRetriever()
        self.reasoning_classifier = ReasoningClassifier()
        self.scorer = EvaluationScorer()
        self.llm_evaluator = LLMEvaluator()
    
    async def evaluate_decision(self, scenario: str, user_action: str, user_reasoning: str):
        # Phase 1: Security Analysis
        threat_indicators = self.threat_extractor.extract(scenario)
        expected_behavior = self.security_analyzer.determine_safe_behavior(threat_indicators)
        threat_knowledge = self.threat_retriever.retrieve(threat_indicators)
        
        # Phase 2: Decision Evaluation
        reasoning_category = self.reasoning_classifier.classify(user_reasoning)
        action_score = self.scorer.score_action(user_action, expected_behavior)
        reasoning_score = self.scorer.score_reasoning(reasoning_category)
        
        # Phase 3: LLM Enhancement
        llm_evaluation = await self.llm_evaluator.evaluate(
            scenario, user_action, user_reasoning, 
            threat_indicators, expected_behavior
        )
        
        # Combine results
        final_score = (action_score * 0.6) + (reasoning_score * 0.4)
        
        return {
            "threat_analysis": {
                "indicators": threat_indicators,
                "expected_behavior": expected_behavior,
                "threat_knowledge": threat_knowledge
            },
            "evaluation": {
                "action_score": action_score,
                "reasoning_score": reasoning_score,
                "final_score": final_score,
                "reasoning_category": reasoning_category
            },
            "llm_insights": llm_evaluation
        }
```

---

## 🔒 Responsible AI Considerations for Your Agent

*   **Fairness:** Your scoring rubric must be blind to user identity, job title, or personal characteristics. Only evaluate behavior.
*   **Transparency:** Every score must include a clear explanation of why it was assigned.
*   **Privacy:** Mask PII in user reasoning before sending to LLM (reuse Member 1's sanitization).
*   **Prompt Injection Protection:** Treat user reasoning as data only, never as instructions to the LLM.
*   **Human Oversight:** Flag unusual or edge-case evaluations for human review.

---

## 📊 Database Schema for Your Tables

You'll work with these PostgreSQL tables:

```sql
-- User responses
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    scenario_id UUID REFERENCES scenarios(id),
    chosen_action TEXT NOT NULL,
    user_reasoning TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Evaluation results
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID REFERENCES responses(id),
    action_score INTEGER NOT NULL,
    reasoning_score INTEGER NOT NULL,
    final_score INTEGER NOT NULL,
    threat_indicators JSONB,
    reasoning_category TEXT,
    llm_evaluation JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Quick Start Commands for Development

```bash
# Install required spaCy model
python -m spacy download en_core_web_sm

# Run your tests
cd backend
pytest tests/test_evaluation_agent.py -v

# Start the API with your endpoint
uvicorn main:app --reload

# Test your endpoint
curl -X POST http://localhost:8000/api/agents/evaluate \
  -H "Content-Type: application/json" \
  -d '{"scenario_id": "...", "user_action": "...", "user_reasoning": "..."}'
```

---

## 📝 Viva Preparation Questions for Member 2

1.  **How does your agent ensure fair evaluation across different job roles?**
    *   *Answer:* My scoring rubric is purely behavior-based. I extract threat indicators objectively and score against safe behaviors, ignoring job titles or user identity.

2.  **Why combine security analysis and evaluation in one agent?**
    *   *Answer:* This creates a cohesive pipeline where the security analysis directly informs the evaluation. The threat indicators extracted in phase 1 become the ground truth for scoring in phase 2.

3.  **How do you prevent prompt injection through user reasoning?**
    *   *Answer:* I treat user reasoning strictly as data for classification, never as instructions. The LLM prompt is carefully designed to analyze reasoning content without executing any embedded commands.

4.  **What's the role of RAG in your evaluation?**
    *   *Answer:* The threat knowledge RAG provides grounded, real-world cybersecurity context. This ensures my evaluation is based on established threat patterns, not just LLM guesses.

5.  **How do you ensure scoring consistency?**
    *   *Answer:* I use a deterministic rubric for action scoring and standardized classification for reasoning. The LLM evaluation is supplementary and doesn't override the core rubric-based scoring.
