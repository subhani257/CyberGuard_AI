# Dashboard and database audit — 2026-09-19

## Data path

The dashboard calls `GET /api/coach/dashboard-summary` with the authenticated user's token. That endpoint reads `decisions`, `scenarios`, `user_learning_profile`, `users`, and the latest coach `agent_audit_logs` entry from Supabase. The readiness score is the mean of all saved evaluation scores for that user. Channel bars average scores by the channel saved in the evaluation JSON; older decisions use the linked scenario's stored `content.channel`. An unevaluated channel returns `null` and is shown without a percentage. The journey shows the five most recent decisions; the total count covers all decisions. Stored policy count comes from the `org_knowledge` query, and curated baseline rules are excluded from that number.

The dashboard's Completed Scenarios view calls `GET /api/coach/completed-scenarios?limit=20&offset=...`. It pages through this learner's decisions and joins each saved scenario title and channel, including older scenarios whose owner field is null. Each entry shows its score, completion date, chosen action, and reasoning. The API never returns another learner's decisions.

The existing Training Arena sector briefing calls the same endpoint with `channel=...`. The API filters all saved decisions before pagination, reports the sector's full count and average score, and resolves older channel values from their linked saved scenarios. Each row links to its scenario detail. Unknown channels are not assigned to Email. A read-only live request for the learner with the 67/100 Email attempt returned three Email completions with scores 67, 40, and 40, so the correct sector average is 49/100 rather than an unevaluated score.

The full `/history` page lists all attempts and links to `/history/{decision_id}`. The detail endpoint returns the original saved scenario, available choices, learner action and reasoning, evaluation scores and feedback, and scenario clues after checking decision ownership. The dashboard top navigation links directly to this page.

When Supabase is configured, database errors return HTTP 503. The UI shows an error instead of displaying default metric values. Without Supabase, the API explicitly reports `data_source: memory` for local demos.

## Agent persistence contract for new runs

| Stage | Durable output | Audit `details` |
| --- | --- | --- |
| Scenario | `scenarios.content` plus role, difficulty, threat type, owner | Sanitized context and request fields, full generated scenario, agent trace |
| Evaluation | `decisions` action, reasoning, score, channel, threat analysis, safe behavior, retrieved knowledge, reasoning classification, review flag, trace | Input action/reasoning and full evaluation output with trace |
| Coach | `user_learning_profile` next path and `users.readiness_score` | Evaluation input, recent decision history, difficulty, full coaching output, trace |
| Onboarding | `users` and `user_learning_profile` | Onboarding input, baseline profile output, LLM or fallback trace, retrieved training context |
| Policy extraction | `org_knowledge` rules and embeddings | Sanitized document input, extracted rules, stored row IDs, extraction method |

Each graph trace records whether an LLM or deterministic fallback ran, the model name when used, and the LLM input and output. The evaluation API runs only the evaluation node; coaching runs after the evaluation is saved. This avoids generating an unsaved coaching output during evaluation. The channel and analysis live in `decisions.evaluation` JSONB. The latest coaching text is retrieved from `agent_audit_logs.details`. No new database columns are required for these payloads.

## Live read-only validation

`backend/scripts/validate_db_schema.py` checked the configured Supabase project. All required table columns were available. At audit time it contained 54 scenarios, 28 decisions, 5 learning profiles, and 66 audit rows. Historical gaps were present: all 28 decisions predated the expanded analysis envelope; 32 older agent logs had no full input/output/trace envelope; there were no scenario or evaluation run audit entries. Nineteen decisions referenced scenarios whose `user_id` was null. Those scenario links are valid and the dashboard now resolves their saved channel through `scenario_id`, but their ownership cannot be inferred for the six ownerless scenarios with no linked decision.

The live check verifies reachable tables, columns, and row content through the service API. It does not inspect deployed indexes, foreign key definitions, or RLS policy definitions because this project has no SQL management connection configured. Those definitions were reviewed in `backend/database/schema.sql` only.

These historical intermediate values were never saved and cannot be reconstructed reliably from the existing rows. The validation command reports the historical gaps until records from new runs are present or the old rows are separately annotated. It does not change live data.
