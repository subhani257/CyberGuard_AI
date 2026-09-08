# MEMBER 3 IMPLEMENTATION PLAN

## 1. Project Analysis: What the Current Workspace Already Implements

The current project is a FastAPI + Next.js cybersecurity training platform with a Supabase/PostgreSQL backend. The implemented code shows three major visible modules already in place:

- `backend/main.py`
  - FastAPI application entry point.
  - Includes two routers:
    - `api.scenario_routes`
    - `api.evaluation_routes`
  - No auth router or middleware is currently included.

- `backend/api/scenario_routes.py`
  - Exposes `POST /api/generate-scenario`
  - Accepts `user_id`, `role`, and `difficulty`
  - Calls `get_org_context()`, sanitizes text, calls AI scenario generator, returns scenario JSON.
  - This is clearly part of Member 1’s scenario-generation pipeline.

- `backend/api/evaluation_routes.py`
  - Exposes `POST /api/agents/evaluate`
  - Loads scenario content from Supabase `scenarios`
  - Runs threat extraction, safe behavior analysis, RAG lookup, reasoning classification, and evaluation
  - Saves results into `public.decisions`
  - This is clearly part of Member 2’s evaluation pipeline.

- `backend/agents/scenario_agent.py`
  - Uses OpenAI API to create scenario JSON with `scenario_text`, `choices`, and `threat_type`.
  - This is a scenario-generation AI agent.

- `backend/agents/security_analysis.py`
  - Contains safe-behavior mapping for threat types such as:
    - `spoofed_domains`
    - `financial_requests`
    - `urgency_indicators`
    - `authority_abuse`
    - `suspicious_urls`
    - `attachment_requests`

- `backend/agents/evaluation_agent.py`
  - Contains scoring logic, safety thresholds, and LLM-based evaluation output.
  - Uses `OpenAI_API_KEY` and returns a structured evaluation payload with scores and human review flagging.

- `backend/nlp/ner.py`
  - Contains `sanitize_input()` for masking entities.
  - This is clearly Member 1’s input sanitization work.

- `backend/rag/retrieval.py`
  - Contains mock role-based retrieval logic for org context.
  - This is Member 1’s retrieval/knowledge-layer work.

- `backend/rag/threat_retrieval.py`
  - Implements retrieval from `cyber_threats` with Supabase vector search.
  - This belongs to Member 2.

- Existing frontend pages:
  - `frontend/app/page.tsx` — landing page
  - `frontend/app/dashboard/page.tsx` — dashboard UI
  - `frontend/app/scenario/page.tsx` — scenario challenge flow
  - `frontend/app/evaluation/page.tsx` — evaluation/results flow
  - `frontend/app/admin/page.tsx` — admin review console mock UI

The current project is not yet implementing authentication or authorization:
- No `login`, `register`, `logout`, `JWT`, `Bearer`, or middleware code exists in the workspace.
- `Depends` is imported in `backend/api/evaluation_routes.py` but not used.
- `backend/database/schema.sql` includes RLS policies using `auth.uid()`, which indicates the intended architecture expects authenticated Supabase users, but the actual auth layer is not implemented yet.
- `docs/README.md` and `docs/TECH_STACK.md` explicitly say:
  - “Auth: JWT / managed authentication”
  - “Supabase Auth (handles login, JWT tokens, and Row Level Security for data isolation).”
- That means Member 3 should implement the missing auth layer aligned with the project’s existing architecture, not invent a separate custom stack.

---

## 2. Member 3 Core Responsibility

### Member 3 Core Responsibility

Member 3 owns the authentication and authorization layer for the platform. In the current project, this is the missing but required security foundation. The project documentation names this as:

- “Adaptive Training & User Security”
- “Auth, RBAC, data protection”
- “Secure login & role-based dashboards”
- “Authentication (JWT/session-based)”
- “Role-Based Access Control (Learner / Trainer / Admin)”

This means Member 3 must own:
- User identity verification
- Secure login flow
- JWT/session handling
- Protected API routes
- Role-based authorization
- Protected frontend routes/pages
- Security hardening for tokens, secrets, and access enforcement

What Member 3 must implement:
- Login endpoint(s) for user authentication
- Session/token validation for protected API routes
- Role checks for protected endpoints
- Integration with Supabase Auth and/or JWT validation
- Frontend authentication state and route protection
- Security policies and error handling for unauthorized or invalid sessions

What Member 3 should reuse:
- `public.users` table from `backend/database/schema.sql`
- `public.user_learning_profile` and `public.agent_audit_logs`
- Supabase Auth as the intended managed authentication system
- Existing FastAPI app structure in `backend/main.py`
- Existing Next.js app structure under `frontend/app`
- Existing RLS assumptions already described in the database schema

What is outside Member 3’s responsibility:
- Scenario generation is Member 1
- Threat extraction and evaluation scoring are Member 2
- AI scenario creation, threat intelligence retrieval, and decision evaluation logic remain outside Member 3’s scope
- Member 3 does not redesign the training engine or scenario/decision logic

Dependencies on Member 1:
- Member 3 must protect scenario-generation endpoints and user-facing scenario pages if they are intended to be authenticated
- Member 3 must align user identity with `users.role` and any role metadata used by scenarios

Dependencies on Member 2:
- Member 2’s `POST /api/agents/evaluate` endpoint should be protected and should reject unauthenticated users
- Member 2’s decision records must be associated with the authenticated user and not accepted from a different user
- Member 2 should reuse Member 3’s auth middleware for checks

Integration points with the final system:
- Frontend login -> token/session -> protected dashboard
- Protected scenario pages and evaluation endpoints
- Authenticated user context used by scenario generation and adaptive training
- Admin-only review pages and privileged actions

---

## 3. Review of Member 1 and Member 2 Work

### Components already implemented by Member 1
From the docs and code:
- `backend/agents/scenario_agent.py`
- `backend/nlp/ner.py`
- `backend/rag/retrieval.py`
- `backend/api/scenario_routes.py`
- `frontend/app/scenario/page.tsx`
- `frontend/components/ScenarioCard.tsx` is referenced in docs but not yet visible in the actual workspace; the actual page is the scenario flow in `frontend/app/scenario/page.tsx`

Member 1 owns:
- Scenario generation
- PII masking/sanitization
- Organizational context retrieval
- Scenario UI
- Input sanitization for AI prompts

### Components already implemented by Member 2
From the code:
- `backend/nlp/threat_extractor.py`
- `backend/nlp/classifier.py`
- `backend/agents/security_analysis.py`
- `backend/agents/evaluation_agent.py`
- `backend/rag/threat_retrieval.py`
- `backend/api/evaluation_routes.py`
- `frontend/app/evaluation/page.tsx`
- `frontend/app/admin/page.tsx` is a review dashboard for ambiguous decisions and likely belongs to the higher-level evaluation/admin flow

Member 2 owns:
- Threat extraction
- Security-analysis rules
- Reasoning classification
- Score generation
- Evaluation API
- Admin review flow

### Shared database tables/models already in use
From `backend/database/schema.sql` and `seed.sql`:
- `public.users`
- `public.scenarios`
- `public.decisions`
- `public.org_knowledge`
- `public.cyber_threats`
- `public.cyber_training`
- `public.user_learning_profile`
- `public.agent_audit_logs`

### Existing security/sanitization mechanisms
- `sanitize_input()` in `backend/nlp/ner.py`
- RLS policies in `backend/database/schema.sql`
- Service role use for backend RAG operations
- Prompt restrictions in AI scripts

### Existing authentication or JWT verification
- There is no real auth middleware or JWT verifier in the current workspace.
- `auth.uid()` is referenced only in SQL RLS, which shows the intended architecture but not the actual Python auth layer.

This means Member 3 must create the missing auth layer without duplicating Member 1 or Member 2 functionality.

---

## 4. Database Architecture and Member 3 Impact

### Actual database architecture already present
The schema already defines:
- `public.users`
- `public.scenarios`
- `public.decisions`
- `public.org_knowledge`
- `public.cyber_threats`
- `public.cyber_training`
- `public.user_learning_profile`
- `public.agent_audit_logs`

The important point: the current schema uses `users.role` as a text field and clearly stores a user’s job role like “Finance Manager” or “HR Officer”, which is different from system access role such as “learner”, “trainer”, or “admin”.

### What Member 3 needs to use
Member 3 should rely on:
- `public.users.id` as the user identity key
- `public.users.email` for login identity
- `public.users.full_name` for display
- `public.users.role` for business/role-based personalization
- `public.user_learning_profile.user_id` for adaptive learning association
- `public.agent_audit_logs` for auth/audit logging

### Minimal database changes required for Member 3
The project already implies Supabase Auth usage, so the best fit is to avoid creating a custom auth schema unless absolutely necessary.

Recommended minimal change:
| Table | Column | Data type | Relationship | Purpose | Why Member 3 needs it |
|---|---|---|---|---|---|
| `public.users` | `access_role` | `TEXT` | Same row as user | Stores access level: `learner`, `trainer`, `admin` | Allows RBAC without redefining the user profile table |
| `public.users` | `is_active` | `BOOLEAN` | Same row as user | Tracks whether the account is enabled | Prevents disabled users from logging in |
| `public.users` | `last_login_at` | `TIMESTAMP WITH TIME ZONE` | Same row as user | Records latest successful login | Useful for audit and security review |

Why no large auth schema:
- `docs/TECH_STACK.md` explicitly states that Supabase Auth manages login, JWT, and RLS.
- The current workspace does not contain a custom custom-auth database design.
- Adding custom tables like `refresh_tokens` or `user_sessions` would be unnecessary unless the project deliberately rejects Supabase Auth.

Important design distinction:
- `users.role` = business role / scenario target role (e.g., Finance Manager)
- `users.access_role` = system access/authorization role (e.g., learner, trainer, admin)

This distinction is required so that Member 3 can protect system access without breaking Member 1/2 scenario personalization.

---

## 5. Final System Architecture and Member 3 Placement

The final architecture should be:

Frontend
↓
Authentication / session handling
↓
Backend API
↓
Supabase Auth / PostgreSQL / RLS
↓
Scenario generation / evaluation / adaptive learning modules

Current actual architecture:
- Frontend: Next.js pages under `frontend/app`
- Backend: FastAPI routers in `backend/api`
- Database: Supabase/PostgreSQL tables in `backend/database`
- AI modules:
  - scenario generation (Member 1)
  - evaluation/threat analysis (Member 2)
  - adaptive training/coach logic (not yet implemented in visible code, but represented in docs as part of the system)

Member 3 sits between the end user and the rest of the system:
- validates identity
- determines access rights
- grants access to routes
- ensures protected routes use authenticated user identity
- provides the user context required by the other modules

Example flow:
- User opens app
- Frontend checks auth state
- If unauthenticated, redirect to login
- Login uses Supabase Auth or backend JWT exchange
- Session token is attached to every request
- API route checks auth
- Route checks RBAC
- Then calls scenario/evaluation service
- Database queries enforce user-level access or admin access through RLS

---

## 6. Authentication Plan

### Recommended approach
Because the project already documents Supabase Auth and the database schema already references `auth.uid()`, Member 3 should use Supabase Auth as the primary authentication mechanism.

This is the most consistent with:
- `docs/TECH_STACK.md`
- `backend/database/schema.sql`
- the project’s stated “managed authentication” stack
- the existing database structure

### Authentication capabilities to implement
Member 3 should implement:
- User login
- Token verification
- Authenticated user identity resolution
- Current-user extraction
- Protected route enforcement
- Logout/session termination
- Invalid/expired token handling

### Minimal auth flow
1. Frontend submits credentials
2. Backend or Supabase Auth verifies credentials
3. Auth service returns access token and refresh token or Supabase session
4. Frontend stores the token securely
5. API requests include token in `Authorization` header
6. Backend validates token and resolves user ID
7. Auth context is available for downstream route logic

### Login requirements
For the current project, the required login should be:
- email + password
- optional username/email form if needed
- fallback to Supabase Auth email/password flow

### Password handling
If using Supabase Auth:
- Member 3 does not need to implement password hashing manually
- Supabase Auth handles hashing and secure storage
- project docs already anticipate managed auth; this is the correct fit

### Token handling
- Access token validation in backend
- Token store managed by Supabase Auth
- Refresh token handling if using a session-based flow
- Expiration behavior and 401 errors on expired or missing tokens

### Required auth-related failure cases
- Missing token
- Invalid token format
- Expired token
- User disabled / inactive
- Wrong password
- Account not found
- Role mismatch / unauthorized

### Auth-only database operations
- Read current user from `public.users` using `auth.uid()`
- Create or update profile metadata when user signs up
- Log auth events in `public.agent_audit_logs`
- Keep user’s access role consistent with login context

---

## 7. Authorization Plan

### Authentication = Who is the user?
Authentication answers:
- Is this user valid?
- Who are they?
- What identity is attached to this request?

### Authorization = What is this user allowed to do?
Authorization answers:
- Can this user access this route?
- Can they access this dashboard?
- Can they create scenarios?
- Can they view admin review data?
- Can they submit scenario evaluations?

### Role model
The project documentation describes:
- Learner
- Trainer
- Admin

However, the actual database currently stores a different `role` concept:
- `users.role` is job role in scenarios, e.g. Finance Manager, HR Officer

Therefore, Member 3 must separate:
- business role used for scenario personalization
- system access role used for admin/learner/trainer access

### Recommended authorization design
Use:
- `access_role` for system authorization
- `role` as scenario/business role

Rules:
- `learner`: access dashboard, scenario participation, evaluation submission
- `trainer`: access learner analytics or scenario monitoring
- `admin`: access admin review console, governance, escalation handling

### Protected routes
Member 3 should enforce:
- Authenticated user required for `/dashboard`, `/scenario`, `/evaluation`
- Role-gated access for admin-only paths
- Protected API routes such as:
  - scenario generation endpoints
  - evaluation endpoints
  - user profile and learning endpoints
  - admin review functions

### Unauthorized vs unauthenticated behavior
- Missing token or invalid session = `401 Unauthorized`
- Valid token but insufficient permissions = `403 Forbidden`
- This should be clearly separated for both API and frontend

### Preventing privilege escalation
- Never trust client-provided role data
- Resolve role from verified auth context only
- Check role server-side for every protected action
- Do not allow a learner to manually change role in request body

---

## 8. Security Controls

Because Member 3 owns auth and authorization, the security plan should stay focused and practical.

Required controls:
- Use Supabase Auth or equivalent secure token issuance
- Store tokens in secure frontend storage or secure cookies, not insecure local variables
- Validate every request server-side
- Reject missing, expired, malformed, or rejected tokens
- Use `Authorization: Bearer ...` headers consistently
- Restrict access to protected endpoints with explicit role checks
- Sanitize input on all user-auth endpoints
- Rate-limit repeated login attempts if the project has a local custom auth implementation
- Keep secrets in `.env` and do not hardcode JWT secrets
- Do not expose sensitive auth errors to the frontend beyond generic messages
- Log auth failures and successful authorization events in `agent_audit_logs` or a dedicated audit table if required
- Keep admin-only routes off the public route tree

Additional project-specific concerns:
- The project stores sensitive employee/training data and threat intelligence in Supabase.
- RLS is already intended for data isolation, so Member 3 must verify that auth context is correctly mapped to user identity before RLS is used.
- Avoid client-side role checks as the only line of defense; they must be duplicated in the backend.

---

## 9. File-by-File Implementation Plan

This is the actual file plan based on the real project structure.

### Likely actual files to modify/create
| File | Purpose | Change required | Why | Depends on | Used by |
|---|---|---|---|---|---|
| `backend/main.py` | FastAPI application entry | Include auth router and middleware | Authentication must be in the main app pipeline | `backend/api/auth_routes.py` | Frontend and all protected routes |
| `backend/api/auth_routes.py` | Authentication endpoints | Create login, logout, me, and token validation endpoints | Missing auth API layer | Existing FastAPI app and Supabase Auth | Frontend login flow |
| `backend/database/schema.sql` | DB schema | Add/adjust role fields for access roles and optional auth metadata | Necessary for RBAC and user verification | Existing `public.users` table | Backend auth logic and RLS |
| `backend/database/seed.sql` | Seed data | Add sample user accounts with access roles and metadata | Realistic auth testing | `public.users` schema | Local testing and demos |
| `backend/tests/test_auth_routes.py` | Auth tests | Add login, missing token, invalid token, access control tests | Required to validate auth and authorization | `backend/api/auth_routes.py` | CI/test pipeline |
| `frontend/app/login/page.tsx` | Frontend authentication UI | Create login form and redirect flow | No login page exists currently | Auth API | User users |
| `frontend/app/dashboard/page.tsx` | User dashboard | Add auth state check and route protection | Current dashboard is mock UI with no auth logic | Auth state provider / token handling | End users |
| `frontend/app/scenario/page.tsx` | Scenario page | Protect route, bind user to session | Scenario participation should be authenticated | Auth guard | Learner flow |
| `frontend/app/evaluation/page.tsx` | Evaluation page | Protect route and require learner permission | Decision submission should be protected | Auth guard | User evaluation flow |
| `frontend/app/admin/page.tsx` | Admin UI | Restrict access to admin role only | Admin review console should be protected | Auth + RBAC | Admins only |
| `frontend/app/layout.tsx` | App-level shell | Add auth provider or layout guard if needed | Consistent auth state across the app | auth client state | All frontend pages |

### Files not required for Member 3
These should remain owned by other members:
- `backend/agents/scenario_agent.py`
- `backend/agents/security_analysis.py`
- `backend/agents/evaluation_agent.py`
- `backend/nlp/threat_extractor.py`
- `backend/nlp/classifier.py`
- `backend/rag/threat_retrieval.py`
- `backend/api/scenario_routes.py`
- `backend/api/evaluation_routes.py`

Member 3’s work should not duplicate or replace these.

---

## 10. API Design

### Authentication & authorization endpoints required by the project

| Method | Endpoint | Purpose | Auth required? | Authz required? | Request data | Response data | Error responses | DB interaction |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate a user and return auth session/token | No | No | email, password | user info + token/session | 400 invalid input, 401 bad credentials | Validate credentials against Supabase Auth or backend auth provider |
| `POST` | `/api/auth/logout` | End session | Yes | No | token/session identifier | success message | 401 invalid token, 400 malformed input | Invalidate session or revoke token |
| `GET` | `/api/auth/me` | Return current authenticated user profile | Yes | No | none | user ID, email, full name, access role | 401 missing/invalid token | Read from `public.users` |
| `POST` | `/api/auth/refresh` | Refresh existing session/token | Yes | No | refresh token | new access token/session | 401 invalid/expired refresh token | Token refresh via auth provider |
| `GET` | `/api/admin/users` | Admin user listing if required | Yes | Admin | none | list of users | 403 forbidden, 401 unauthorized | Read from `public.users` |
| `GET` | `/api/protected/profile` | Return user-specific data | Yes | Learner/Trainer/Admin | none | user profile data | 401, 403 | Query `public.users` and `public.user_learning_profile` |

### Protected existing endpoints that should be enforced
The existing route from Member 2 should be protected:
- `POST /api/agents/evaluate`

This route should enforce:
- valid authenticated user
- optional learner-only access or role-appropriate access
- user_id from auth context rather than a client-supplied value

The scenario route should also be protected:
- `POST /api/generate-scenario`

Because it is user-specific and tied to a user profile and scenario history.

---

## 11. Frontend Integration

Member 3’s frontend work should not overlap with the AI modules built by Members 1 and 2.

### Required frontend tasks
- Create a login UI
- Handle auth state and session persistence
- Redirect unauthenticated users away from protected pages
- Show role-based UI elements
- Restrict admin UI visibility
- Allow logout
- Display clear auth-related errors
- Prevent access to pages if the token is invalid or expired

### Relevant existing frontend files
- `frontend/app/page.tsx` — landing page currently uses “Sign in” link to `/dashboard`
- `frontend/app/dashboard/page.tsx` — dashboard needs auth gating
- `frontend/app/scenario/page.tsx` — protected scenario flow
- `frontend/app/evaluation/page.tsx` — protected evaluation flow
- `frontend/app/admin/page.tsx` — admin-only route

### Frontend guard logic
- If no valid session: redirect to login
- If invalid session: show access error and prompt relogin
- If user role is not allowed: show “Forbidden” or redirect to dashboard
- Use a central auth store or helper rather than duplicating checks across pages

### Important distinction
- Frontend should not handle authorization by only hiding buttons; backend must enforce it.
- UI protection is secondary, not primary security.

---

## 12. Backend Integration

Member 3 must integrate with the existing backend architecture without duplicating or overriding the work of other members.

### Recommended integration model
- Keep API auth responsibilities in `backend/api/auth_routes.py`
- Use middleware or dependency injection for:
  - token validation
  - current user lookup
  - role enforcement
- Keep the logic separate from scenario generation and evaluation logic
- Ensure any user-specific route uses `auth_context.user_id` instead of trusting a request parameter

### Integration pattern
1. Request comes in
2. `Authorization` header is validated
3. user identity is looked up from `public.users`
4. authorized route check executes
5. downstream Member 1/Member 2 service is called with the authenticated user context

### Example usage for another member
For Member 2’s evaluation endpoint:
- the route should require auth
- user identity is extracted from token
- request must not rely on `user_id` from payload
- evaluation is stored against the authenticated user, not arbitrary project data
- a learner may evaluate their own actions; admin or trainer may review but not bypass core checks

This creates secure boundaries between:
- authentication infrastructure (Member 3)
- decision evaluation logic (Member 2)
- scenario generation and personalization (Member 1)

---

## 13. Testing Plan

The current project has only a basic test for root health in `backend/tests/test_scenario_routes.py`. Member 3 must add authentication and authorization tests.

### Required test files
- `backend/tests/test_auth_routes.py`
- `backend/tests/test_auth_rbac.py`
- Optional: extend `backend/tests/test_scenario_routes.py` to ensure protected scenario access

### Tests to include
- successful login
- incorrect password
- invalid credentials
- missing token
- expired token
- invalid token
- protected endpoint access
- correct role access
- incorrect role access
- privilege escalation attempts
- unauthorized requests
- input validation on login
- password security behavior
- logout/session invalidation if implemented
- user profile retrieval using authenticated context

### Test categories
- Auth success path
- Auth failure path
- Role-check path
- Security path
- Regression path

---

## 14. Git / Contribution Evidence

Member 3 should keep work clearly separated and show a clean contribution trail.

Recommended logical commits:
- `feat(auth): add Supabase Auth integration and session validation`
- `feat(auth): implement login and token verification endpoints`
- `feat(auth): add current-user profile and logout flow`
- `feat(rbac): enforce learner/trainer/admin access checks`
- `feat(api): protect scenario and evaluation endpoints`
- `feat(ui): add login and auth session handling in frontend`
- `feat(security): harden auth errors and token validation`
- `test(auth): add login, token, and RBAC test coverage`

This gives a clear evidence trail without claiming work from Member 1 or Member 2.

---

## 15. Implementation Phases

### Phase 1 – Authentication foundation
Step 1: Audit current auth status and confirm intended provider  
- Files: `backend/main.py`, `backend/database/schema.sql`, `docs/TECH_STACK.md`  
- Purpose: confirm architecture must use Supabase Auth / JWT-managed auth  
- Dependencies: existing DB and project documentation  
- Expected output: auth approach approved  
- Testing: confirm no conflicting auth implementation exists

Step 2: Define auth contract and user identity model  
- Files: `backend/database/schema.sql`, `backend/database/seed.sql`  
- Purpose: decide how to represent access role vs business role  
- Dependencies: DB architecture, docs, user roles  
- Expected output: clear `access_role` design and user lookup logic  
- Testing: SQL validation and role-mapping consistency

### Phase 2 – User authentication
Step 3: Build login endpoint  
- Files: `backend/api/auth_routes.py`, `backend/main.py`  
- Purpose: authenticate users and issue session/token  
- Dependencies: auth provider, user table  
- Expected output: login endpoint returning a valid session/token  
- Testing: valid login, invalid credentials, locked users

Step 4: Add current-user lookup and logout flow  
- Files: `backend/api/auth_routes.py`  
- Purpose: resolve the authenticated user and support session termination  
- Dependencies: token verification  
- Expected output: `/api/auth/me` and logout flow  
- Testing: missing token, expired token, logout invalidation

### Phase 3 – Authorization/RBAC
Step 5: Define RBAC rules  
- Files: `backend/database/schema.sql`, `backend/api/auth_routes.py`  
- Purpose: map `learner`, `trainer`, `admin` to access permissions  
- Dependencies: user metadata and access role  
- Expected output: route-level role policy list  
- Testing: correct-role and wrong-role access

Step 6: Implement role-protected dependency logic  
- Files: `backend/api/auth_routes.py` and later protected routes  
- Purpose: verify access rules server-side  
- Dependencies: auth validation  
- Expected output: reusable auth/role dependency  
- Testing: forbidden and unauthorized access responses

### Phase 4 – Backend API protection
Step 7: Protect existing user-facing endpoints  
- Files: `backend/api/scenario_routes.py`, `backend/api/evaluation_routes.py`, `backend/main.py`  
- Purpose: require existing behavior be accessible only to authenticated users  
- Dependencies: auth middleware and RBAC  
- Expected output: secured scenario and evaluation endpoints  
- Testing: missing token, invalid token, learner/admin access scenarios

### Phase 5 – Frontend integration
Step 8: Implement login page and auth state  
- Files: `frontend/app/login/page.tsx`, `frontend/app/layout.tsx`, `frontend/app/dashboard/page.tsx`  
- Purpose: ensure user can log in and maintain session  
- Dependencies: auth API and frontend state  
- Expected output: secure login flow  
- Testing: login success/failure, redirect behavior

Step 9: Add route guards and role-based UI  
- Files: `frontend/app/admin/page.tsx`, `frontend/app/scenario/page.tsx`, `frontend/app/evaluation/page.tsx`  
- Purpose: protect pages based on auth and role  
- Dependencies: auth state  
- Expected output: restricted UI for unauthorized users  
- Testing: unauthorized access to admin page and protected pages

### Phase 6 – Security hardening
Step 10: Harden secrets, token validation, and error handling  
- Files: `.env` usage, auth route files, frontend auth logic  
- Purpose: prevent token leakage and insecure auth behavior  
- Dependencies: implemented auth flow  
- Expected output: secure auth implementation  
- Testing: invalid token, malicious or malformed headers, expired sessions

### Phase 7 – Integration with Members 1 and 2
Step 11: Integrate user identity with scenario and evaluation flows  
- Files: `backend/api/scenario_routes.py`, `backend/api/evaluation_routes.py`, `backend/database/schema.sql`  
- Purpose: tie each scenario/evaluation to the authenticated user  
- Dependencies: auth and RBAC  
- Expected output: protected and attributable user actions  
- Testing: no cross-user access, consistent audit trails

### Phase 8 – Testing and validation
Step 12: Run auth and RBAC regression tests  
- Files: `backend/tests/test_auth_routes.py`, `backend/tests/test_auth_rbac.py`  
- Purpose: verify login, logout, token logic, and access control  
- Dependencies: implemented auth flow  
- Expected output: passing auth test suite  
- Testing: full suite and manual review

---

## 16. Member 3 vs Other Members

| Area | Member 3 | Member 1 | Member 2 | Shared/Integration |
|---|---|---|---|---|
| Primary responsibility | Authentication and authorization | Scenario generation and personalization | Evaluation and security analysis | Shared user data and protected endpoints |
| Main backend logic | Login, token validation, RBAC | Scenario generation route and agent | Evaluation route and scoring agent | User profile and role mapping |
| Database ownership | `public.users` auth metadata and access roles | `public.scenarios` and org knowledge | `public.decisions` and threat tables | `public.user_learning_profile`, `public.agent_audit_logs` |
| Frontend ownership | Login, session state, protected routes | Scenario UI | Evaluation/admin review UI | Shared dashboard |
| Security responsibility | Auth, token validation, route protection | Input sanitization | API/agent security and scoring safeguards | RLS and audit logging |
| Scope boundary | Identity and access control | AI scenario creation | AI decision scoring | Shared learning and platform user flow |

---

## 17. Viva / Contribution Explanation

During the viva, Member 3 can explain contribution like this:

- “I implemented the platform’s authentication and authorization layer.”
- “The system uses secure identity verification rather than trusting client-side data.”
- “Authentication answers who the user is; authorization answers what they are allowed to do.”
- “I separated business role from access role to avoid mixing scenario personalization with user permissions.”
- “Protected routes are enforced on the backend, not just hidden in the UI.”
- “Supabase Auth is used because the project already documents managed authentication and RLS integration.”
- “Passwords are handled by the auth provider; we do not reinvent password storage.”
- “JWT/session validation ensures expired or invalid tokens are rejected.”
- “My work protects Member 1 and Member 2 modules by ensuring only authenticated and authorized users can invoke their endpoints.”
- “If a user has the wrong role, the API returns a 403 error and the frontend shows an access restriction.”
- “I validated the work with login, token, and RBAC tests.”

---

## Final conclusion

The current workspace shows a mature scenario-generation and decision-evaluation foundation, but it does not yet implement the missing auth layer. The project documentation and schema strongly indicate the intended architecture is Supabase Auth + JWT-managed sessions + RLS + RBAC. The right Member 3 implementation is therefore not a full redesign, but a focused, low-risk auth and authorization layer that fits the current project exactly.

Member 3 should:
- use the existing `public.users` model as the foundation
- add a clear separation between business role and access role
- implement secure login, token validation, and RBAC
- protect the existing scenario and evaluation routes
- integrate frontend route guards and UI state
- validate with auth-focused tests

This keeps the work aligned with the project’s actual state, respects Member 1 and Member 2 ownership, and makes Member 3’s contribution clearly identifiable and defensible in the viva and contribution review.
