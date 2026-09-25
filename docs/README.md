# 🛡️ CyberGuard AI

**Adaptive Multi-Agent Cybersecurity Awareness and Decision Training System**

[![Module](https://img.shields.io/badge/Module-IT%203041-blue)]()
[![Type](https://img.shields.io/badge/Type-Agentic%20AI%20%2F%20Multi--Agent%20System-orange)]()
[![Status](https://img.shields.io/badge/Status-Functional%20Prototype-green)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

> An intelligent, agent-based training platform that teaches people to make **safer cybersecurity decisions** through realistic, adaptive, AI-generated scenarios — instead of static slides and generic quizzes.

**Final submission package:** [assignment report](FINAL_ASSIGNMENT_REPORT_2026-09-16.md) · [evaluation evidence](EVALUATION_REPORT_2026-09-16.md) · [demo runbook](FINAL_DEMO_RUNBOOK.md) · [raw benchmark results](evidence/evaluation_results.json)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Multi-Agent Architecture](#-multi-agent-architecture)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Overview](#-api-overview)
- [Security](#-security)
- [Responsible AI](#-responsible-ai)
- [Evaluation Strategy](#-evaluation-strategy)
- [Team & Contribution Model](#-team--contribution-model)
- [Project Roadmap](#-project-roadmap)
- [Commercialization](#-commercialization)
- [Scope](#-scope)
- [License](#-license)

---

## 🧭 Overview

Cybersecurity threats increasingly exploit **human decision-making** — phishing, social engineering, business email compromise, and impersonation — rather than purely technical vulnerabilities. Most awareness training is static, generic, and doesn't adapt to a person's role or recurring weaknesses.

**CyberGuard AI** solves this with a **multi-agent AI system** that generates realistic cybersecurity scenarios, evaluates how a user responds (and *why*), retrieves grounded knowledge to support its feedback, and adapts future training to each person's demonstrated weaknesses.

This project is built for the **IT 3041 – Information Retrieval and Web Analytics** module and is intentionally scoped as a **university-level prototype**, not a full enterprise SOC/SIEM platform.

---

## ❗ The Problem

Traditional cybersecurity awareness training relies on:

- Static PowerPoints and generic videos
- One-size-fits-all content for every role
- Repetitive multiple-choice quizzes
- No insight into *why* a user made a decision
- Feedback that isn't grounded in verified knowledge

**Result:** users don't get realistic practice, and organizations can't identify or target specific behavioral weaknesses.

---

## 💡 Our Solution

CyberGuard AI follows a simple adaptive loop:

```
Scenario → User Decision → Analysis → Evaluation → Knowledge Retrieval → Feedback → Adaptation
```

**Example:**
> *"Your manager sends an urgent message asking you to transfer confidential supplier payment details to a new external email address."*

The system presents this scenario, lets the user choose a response and explain their reasoning, evaluates the decision against retrieved cybersecurity guidance, and delivers **explainable, personalized feedback** — then adjusts the difficulty and topic of the next scenario accordingly.

---

## 🤖 Multi-Agent Architecture

CyberGuard AI uses **three member-owned pipelines containing four specialized components**, each with a clearly defined responsibility:

| Agent | Responsibility |
|---|---|
| 🎯 **Scenario Generation Agent** | Generates realistic, role- and difficulty-aware cybersecurity scenarios |
| 🔍 **Security Analysis Agent** | Identifies threat type, indicators, and the expected safe behavior |
| ⚖️ **Decision Evaluation Agent** | Evaluates the user's chosen action and their written reasoning |
| 🎓 **Training Coach Agent** | Converts evaluation results into personalized, explainable feedback and selects the next scenario |

Agents communicate over **REST/HTTP using structured JSON**, making the system easy to test, debug, and demo (e.g. via Postman).

```
Scenario Agent → Security Agent → [User Response] → Evaluation Agent → IR/RAG → Coach Agent → Feedback
```

**Why multiple agents instead of one chatbot?** Splitting responsibilities gives the system separation of concerns, easier testing/debugging, modularity, and independently explainable/evaluable components — rather than one monolithic model doing everything.

---

## 🏗️ System Architecture

```
                    ┌────────────────────┐
                    │        USER        │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │   Web Application   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │     Backend API     │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │  Agent Orchestrator │
                    └──────────┬─────────┘
             ┌─────────────────┼──────────────────┐
             ▼                 ▼                   ▼
     ┌───────────────┐ ┌───────────────┐  ┌───────────────────┐
     │ Scenario Agent │ │ Security Agent│  │  Evaluation Agent  │
     └───────┬───────┘ └───────┬───────┘  └──────────┬─────────┘
             └─────────────────┼──────────────────────┘
                                ▼
                     ┌────────────────────┐
                     │  Training Coach     │
                     │       Agent         │
                     └──────────┬─────────┘
                    ┌───────────┴───────────┐
                    ▼                       ▼
             ┌─────────────┐         ┌─────────────┐
             │  LLM / NLP  │         │   IR / RAG   │
             └─────────────┘         └──────┬──────┘
                                             ▼
                                  ┌──────────────────────┐
                                  │ Cybersecurity Knowledge│
                                  │         Base           │
                                  └──────────┬─────────────┘
                                             ▼
                                  ┌──────────────────────┐
                                  │   PostgreSQL Database  │
                                  └──────────────────────┘
```

---

## ✨ Key Features

- 🔐 **Secure login & role-based dashboards** (Learner / Trainer / Admin)
- 🤖 **AI-generated cybersecurity scenarios** with adjustable difficulty (Easy / Medium / Hard)
- ✅ **Decision + reasoning submission** — the system evaluates *what* you chose and *why*
- 🧠 **NLP-powered analysis**: Named Entity Recognition, text classification, summarization
- 📚 **Information Retrieval / RAG** — feedback is grounded in a curated cybersecurity knowledge base, not free-form LLM guesses
- 📈 **Adaptive learning engine** — future scenarios target your weakest areas
- 📊 **Progress dashboard** with per-category scores (phishing, social engineering, data protection, etc.)
- 🛡️ **Security-by-design**: authentication, RBAC, input sanitization, prompt-injection protection, audit logging
- ⚖️ **Responsible AI**: fairness testing, explainability, transparency, privacy, and human oversight

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 / React / TypeScript |
| Backend | Python / FastAPI / Pydantic |
| Database | Supabase PostgreSQL |
| Agent Orchestration | Custom REST/JSON pipeline |
| LLM | OpenAI `gpt-4o-mini` with deterministic fallbacks |
| NLP | spaCy-compatible rules, entity masking, classification, summarization |
| Embeddings | `text-embedding-3-small`; optional local MiniLM |
| Vector Store | Supabase pgvector |
| Communication | REST + JSON |
| Auth | Supabase Auth + signed application JWT |
| Password storage | Supabase Auth managed storage |
| Deployment | Local prototype; cloud deployment is future work |
| Testing | Pytest, Node test runner, browser E2E walkthrough |
| Version Control | Git / GitHub |

---

## 📁 Project Structure

```
CyberGuard_AI/
├── backend/
│   ├── agents/       # scenario, evaluation and Coach components
│   ├── api/          # authenticated FastAPI routes
│   ├── database/     # Supabase/pgvector schema
│   ├── nlp/          # NER/masking, extraction, classification, summarization
│   ├── rag/          # organization, threat and training retrieval
│   ├── scripts/      # seeders and reproducible assignment evaluation
│   └── tests/
├── frontend/
│   ├── app/          # Next.js application routes
│   ├── components/
│   ├── lib/
│   └── tests/
└── docs/             # proposal, evidence, report and demo runbook
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- A Supabase project with the provided schema applied
- An OpenAI API key for live generation/embeddings

### Installation

```powershell
# Backend (Windows PowerShell)
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Fill backend/.env, then apply backend/database/schema.sql in Supabase.
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000

# Frontend (second terminal)
cd frontend
npm install
npm run dev -- --hostname 127.0.0.1
```

Seed the two source-linked knowledge collections with:

```powershell
backend\.venv\Scripts\python.exe backend\scripts\seed_vector_db.py --tables cyber_threats cyber_training --refresh
```

The app should now be running at `http://localhost:3000` (frontend) and `http://localhost:8000` (API).

---

## 🔌 API Overview

| Endpoint | Description |
|---|---|
| `POST /api/auth/signup` | Create an email learner account |
| `POST /api/auth/login` | Authenticate a learner |
| `POST /api/auth/google` | Exchange a verified Supabase OAuth session |
| `POST /api/org/onboard-policy` | Ingest tenant-scoped policy knowledge |
| `POST /api/coach/onboard-user` | Build the initial profile and training map |
| `POST /api/generate-scenario` | Generate and persist an owned scenario |
| `GET /api/scenarios/{scenario_id}` | Read an owned scenario |
| `POST /api/agents/evaluate` | Evaluate an owned scenario decision |
| `POST /api/coach/process-decision` | Adapt from the stored evaluation |
| `GET /api/coach/dashboard-summary` | Return readiness and next challenge |

**Example — Scenario Agent output:**
```json
{
  "success": true,
  "scenario_id": "bcc7891d-c0b4-41c9-afb7-16de6417a54c",
  "scenario": {
    "situation_title": "A payment request that cannot wait",
    "body": "Your manager requests an urgent vendor-bank change...",
    "difficulty": "medium",
    "channel": "email",
    "choices": ["Approve", "Reply", "Verify out-of-band", "Report"]
  }
}
```

---

## 🔒 Security

CyberGuard AI is a *cybersecurity* project, so the platform itself is built securely:

- Authentication (JWT/session-based)
- Role-Based Access Control (Learner / Trainer / Admin)
- Password storage managed by Supabase Auth
- Input validation & sanitization on all endpoints
- TLS for deployed services is a deployment requirement; localhost uses HTTP
- **Prompt-injection protection** — user reasoning is always treated as *data*, never as instructions to the LLM
- Per-user evaluation rate limiting and selected authentication/Coach audit logging
- Supabase client queries and validated Pydantic request models

---

## ⚖️ Responsible AI

| Principle | How it's addressed |
|---|---|
| **Fairness** | Evaluations are based on *what* the user did, not *who* they are |
| **Explainability** | Every score comes with a plain-language reason and safer alternative |
| **Transparency** | The UI clearly discloses AI-generated/assisted content |
| **Privacy** | Data minimization, purpose limitation, and access control |
| **Human Oversight** | The system never makes autonomous disciplinary/employment decisions |

---

## 📊 Evaluation Strategy

- **Scenario quality**: human-rated realism, relevance, clarity, difficulty
- **NLP performance**: precision/recall/F1 for NER and classification
- **Retrieval quality**: Precision@K, Recall@K on the knowledge base
- **Agent reliability**: success rate, invalid-JSON rate, response time
- **Decision evaluation**: rubric-based scoring against expert-defined criteria
- **Adaptation effectiveness**: adaptive vs. static training score improvement
- **Security testing**: auth bypass attempts, RBAC checks, prompt-injection tests
- **Usability testing**: clarity, feedback usefulness, perceived learning value

---

## 👥 Team & Contribution Model

Each team member owns **one complete end-to-end pipeline** — spanning AI, NLP, IR, security, frontend, and testing — rather than being siloed into a single specialty.

| | Member 1 | Member 2 | Member 3 |
|---|---|---|---|
| **Pipeline** | Scenario Generation & Personalization | Decision Evaluation & Analysis | Adaptive Training & User Security |
| **Agent (Lead)** | Scenario Agent | Evaluation Agent | Coach Agent |
| **NLP** | Entity extraction | Classification | Summarization |
| **Information Retrieval** | Scenario knowledge | Threat knowledge | Training/learning material |
| **Security focus** | Input sanitization | API/agent communication security | Auth, RBAC, data protection |
| **Frontend** | Scenario UI | Evaluation results UI | Progress dashboard |
| **Database** | Scenarios | Responses & results | User profiles & history |
| **Testing focus** | Scenario quality & invalid input | Scoring consistency & adversarial input | Auth, access control, privacy |

> Every member is expected to understand the **full architecture** and be able to answer viva questions on any part of the system — not just their own module. Individual contribution is tracked via Git commits, branches, and pull requests under each member's own account.

---

## 🗺️ Project Roadmap

| Week | Milestone |
|---|---|
| 1 | Problem definition & team roles |
| 2 | Research & architecture design |
| 3 | Backend foundation + authentication |
| 4 | Scenario Agent (LLM integration) |
| 5 | Security Analysis Agent + NLP |
| 6 | Evaluation Agent + RAG/knowledge base |
| 7 | Training Coach Agent (adaptive logic) |
| 8 | Security hardening + Responsible AI |
| 9 | Evaluation & testing |
| 10 | Documentation & finalization |
| 11 | Viva preparation |

---

## 💼 Commercialization

CyberGuard AI is designed as an academic prototype with a clear path to a **SaaS product**:

- **Target market**: SMEs, educational institutions, corporate training providers, tech companies, MSPs
- **Pricing tiers**: Free/Student → Starter → Professional → Enterprise
- **Deployment path**: containerized or cloud multi-tenant SaaS after production hardening
- **Differentiators**: multi-agent architecture, reasoning-aware evaluation, RAG-grounded feedback, security-by-design

---

## 🎯 Scope

**In scope:** authentication, adaptive AI scenarios, NLP, RAG, explainable feedback, adaptive difficulty, progress tracking, RBAC, audit logging, Responsible AI mechanisms.

**Out of scope:** real penetration testing, actual phishing campaigns, malware development, autonomous incident response, employee surveillance, automated disciplinary decisions, full enterprise SOC/SIEM.

---

## 📄 License

This project is developed for academic purposes as part of **IT 3041 – Information Retrieval and Web Analytics**.

Distributed under the [MIT License](LICENSE) unless otherwise specified by your institution's academic policy.

---

<p align="center">Built with 🛡️ by the CyberGuard AI team</p>
