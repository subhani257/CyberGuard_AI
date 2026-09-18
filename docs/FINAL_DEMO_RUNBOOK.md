# CyberGuard AI — Final Demo Runbook

## Before the demo

1. In `backend`, activate `.venv` and run `python -m pytest -q`. Expected: **48 passed**.
2. In `frontend`, run `npm run test`, `npm run typecheck`, and `npm run build`. Expected: **24 passed**, typecheck passed, build passed.
3. Confirm `backend/.env` contains Supabase, OpenAI, and a 32+ character `JWT_SECRET`. Never display the file during the demo.
4. Start the backend with `python -m uvicorn main:app --host 127.0.0.1 --port 8000`.
5. Start the frontend with `npm run dev -- --hostname 127.0.0.1`.
6. Open `http://127.0.0.1:3000`.

## Seven-minute demonstration

### 1. Problem and architecture — 45 seconds

“CyberGuard AI replaces static awareness quizzes with an adaptive decision loop. Three members own three end-to-end pipelines containing four specialized components: Scenario Generation, Security Analysis, Decision Evaluation, and Training Coach.”

Show the architecture in `docs/FINAL_ASSIGNMENT_REPORT_2026-09-16.md`.

### 2. Signup and onboarding — 75 seconds

- Create or sign in to a learner account.
- Enter a real job title and department.
- Load the standard policy template.
- Point out that policy chunks are sanitized, tenant-scoped, embedded, and stored in `org_knowledge`.
- Show the generated attack surface, priority channel, and training map.

### 3. Personalized scenario — 90 seconds

- Launch the recommended challenge.
- Explain that the Scenario Agent receives the database-backed role/company, difficulty, channel, Coach topic, and organization context.
- Show that all content is benign and contains exactly four choices.
- Select one action and enter reasoning.

### 4. Evaluation and coaching — 90 seconds

- Submit the decision.
- Show action score, reasoning score, security signals, expected behavior, explanation, and Coach takeaway.
- Explain that the Evaluation API reloads the exact learner-owned scenario and rejects an action not present in its choices.
- Explain that the Coach reloads the stored evaluation; it does not trust browser-submitted scores.

### 5. Adaptive dashboard — 60 seconds

- Open the dashboard.
- Show readiness, decision history, policy grounding count, training map, next channel, next focus, and next difficulty.
- Point out that the next scenario link carries the Coach recommendation into the next Scenario Agent request.

### 6. Evidence — 60 seconds

Use `docs/EVALUATION_REPORT_2026-09-16.md`:

- 32 live threat + 32 live training records.
- Threat retrieval Hit@3 and MRR: 1.00.
- Training retrieval Hit@3 and MRR: 1.00.
- Threat extraction F1: 0.849.
- Identical behavior across four roles: 0-point score difference.
- Prompt injection received 16/100, not the requested 100.
- Three live scenario calls: 100% valid, mean 4.20 seconds.

## Failure recovery

- If OpenAI is unavailable, the Scenario Agent returns a valid benign fallback and deterministic evaluation still works.
- If the optional local embedding package is absent, live threat/training retrieval uses `text-embedding-3-small`, matching the stored vectors.
- If Supabase is unavailable, the process-local store supports a single-process classroom demonstration, but durable history requires Supabase.
- If Google OAuth cannot be completed, use email signup. The OAuth provider redirect itself has been verified.

## Viva questions

- **Why multiple components?** Each stage has a narrow contract, separate evidence, and a clear failure boundary.
- **Where is RAG used?** Organization policies ground scenarios, threat intelligence grounds evaluation, and training guidance grounds coaching.
- **How is fairness handled?** Authoritative scores use action and reasoning signals only; identity and job role are excluded.
- **How is prompt injection handled?** Reasoning is treated as data, output is structured, and the LLM narrative cannot override deterministic scores.
- **What remains before production?** Independent evaluation, more users, deployed TLS/restricted CORS, durable rate limiting, full admin review workflow, monitoring, and contractual LLM data controls.
