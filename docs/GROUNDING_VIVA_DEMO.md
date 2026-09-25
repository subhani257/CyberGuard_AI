# Knowledge-grounding viva demonstration

## Defensible claim

CyberGuard AI does not claim that the pretrained language model contains only project knowledge. The application accepts factual AI prose only when it cites retrieved knowledge-base record IDs and supplies exact evidence quotes that are verified locally. Deterministic code remains authoritative for learner scores and difficulty changes.

Fictional scenario details are separately labelled as simulation content. When a model response has missing or invented citations, the response is rejected and replaced with either evidence-backed deterministic guidance or an explicit refusal.

## Run the offline demonstration

From the `backend` directory:

```powershell
..\venv\Scripts\python.exe scripts\demonstrate_grounding.py
```

The five checks demonstrate:

1. A response using a retrieved record ID and exact quote is accepted.
2. An old answer is rejected after the knowledge-base fact changes.
3. An answer using the updated fact is accepted.
4. An invented citation is rejected.
5. A factual response is rejected when retrieval returns no evidence.

Run the automated grounding tests with:

```powershell
..\venv\Scripts\python.exe -m pytest tests\test_grounding_contract.py -q
```

## Evidence to show an examiner

For each pipeline node, open the returned or stored `agent_trace` and show:

- `retrieval_output`: the exact records supplied to generation;
- `llm_input` and `llm_output`: what the model received and returned;
- `grounding_status`: `grounded`, `refused`, or `simulation_template`;
- `citation_validation_errors`: why an output was rejected;
- `execution_mode`: whether the accepted response came from the grounded LLM or deterministic fallback.

The visible response also contains `grounding.evidence`, which exposes the supporting record ID, source, source URL, content, and similarity when available.

## Important limitation

The local gate proves that cited IDs were retrieved and quoted text exists exactly in those records. It does not mathematically prove semantic entailment for every paraphrased word. Human review remains appropriate for ambiguous or high-impact output. This limitation should be stated directly rather than claiming that a prompt removes the model's pretrained knowledge.
