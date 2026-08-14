# 🛡️ CyberGuard AI

**Adaptive Multi-Agent Cybersecurity Awareness and Decision Training System**

[![Module](https://img.shields.io/badge/Module-IT%203041-blue)]()
[![Type](https://img.shields.io/badge/Type-Agentic%20AI%20%2F%20Multi--Agent%20System-orange)]()
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

> An intelligent, agent-based training platform that teaches people to make **safer cybersecurity decisions** through realistic, adaptive, AI-generated scenarios — instead of static slides and generic quizzes.

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

CyberGuard AI is powered by **four specialized, cooperating agents**, each with a clearly defined responsibility:

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
| Frontend | React / Next.js |
| Backend | Python (FastAPI) |
| Database | PostgreSQL |
| Agent Orchestration | LangGraph / custom orchestration |
| LLM | Cloud-hosted or local LLM |
| NLP | spaCy / Transformers |
| Embeddings | Sentence Transformers |
| Vector Store | FAISS / Chroma |
| Communication | REST + JSON |
| Auth | JWT / managed authentication |
| Password Hashing | Argon2 / bcrypt |
| Deployment | Docker (local or cloud) |
| Testing | Pytest, Postman, Playwright |
| Version Control | Git / GitHub |

---

## 📁 Project Structure

```
CyberGuard-AI/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── api/
│   ├── models/
│   ├── database/
│   └── auth/
│
├── agents/
│   ├── scenario_agent/
│   ├── security_agent/
│   ├── evaluation_agent/
│   └── coach_agent/
│
├── nlp/
│   ├── ner/
│   ├── classifier/
│   └── summarizer/
│
├── rag/
│   ├── documents/
│   ├── embeddings/
│   └── retrieval/
│
├── tests/
├── docs/
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (recommended)
- An LLM API key (or local LLM setup)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/CyberGuard-AI.git
cd CyberGuard-AI

# 2. Set up environment variables
cp .env.example .env
# fill in DB credentials, LLM API key, JWT secret, etc.

# 3. Start all services with Docker
docker-compose up --build
```

### Running locally without Docker

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

The app should now be running at `http://localhost:3000` (frontend) and `http://localhost:8000` (API).

---

## 🔌 API Overview

| Endpoint | Description |
|---|---|
| `POST /api/auth/login` | Authenticate a user |
| `POST /api/agents/scenario` | Generate a new scenario |
| `POST /api/agents/security-analysis` | Analyze a scenario for threat indicators |
| `POST /api/agents/evaluate` | Evaluate a user's decision |
| `POST /api/agents/coach` | Generate personalized feedback |
| `GET /api/training/history` | Retrieve a user's training history |
| `GET /api/training/progress` | Retrieve a user's progress metrics |
| `POST /api/admin/scenarios` | Manage scenarios (admin only) |

**Example — Scenario Agent output:**
```json
{
  "scenario_id": "SC001",
  "scenario": "Your manager asks you to urgently send supplier payment information...",
  "difficulty": "medium",
  "choices": ["Send", "Verify", "Ignore", "Forward"]
}
```

---

## 🔒 Security

CyberGuard AI is a *cybersecurity* project, so the platform itself is built securely:

- Authentication (JWT/session-based)
- Role-Based Access Control (Learner / Trainer / Admin)
- Password hashing with Argon2/bcrypt
- Input validation & sanitization on all endpoints
- HTTPS/TLS for data in transit
- **Prompt-injection protection** — user reasoning is always treated as *data*, never as instructions to the LLM
- Rate limiting and audit logging
- Parameterized queries / ORM to prevent SQL injection

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
- **Deployment**: Docker (local demo) or cloud (multi-tenant SaaS)
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
