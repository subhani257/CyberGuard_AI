# 📄 CyberGuard AI — Final Project Proposal (Updated)
**Date:** August 20, 2026

**Project Title:** CyberGuard AI – Agentic Cybersecurity Training with Contextual Realism and Reasoning-Aware Evaluation
**Domain:** Cybersecurity / Educational Technology (EdTech) / AI

---

## 1. Problem Statement
Current cybersecurity awareness training is fundamentally broken. It relies on generic, annual multiple-choice quizzes that employees mindlessly click through for compliance purposes. 
*   **Lack of Realism:** Scenarios are static and irrelevant to an employee's actual daily workflows (e.g., a Finance Manager receives the same generic training as an HR Intern).
*   **Flawed Evaluation:** Existing systems (like KnowBe4 or Hoxhunt) only track binary metrics ("Did the user click the link?"). They fail to evaluate the *cognitive reasoning* behind the user's decision.
*   **The Result:** Despite billions spent on training, 95% of data breaches still involve the "human element," with Business Email Compromise (BEC) costing businesses over $3 billion in 2025 alone.

## 2. Proposed Solution
**CyberGuard AI** is a multi-agent SaaS platform that replaces static compliance checklists with dynamic, role-specific simulations. 
Instead of a simple quiz, users are presented with a "Context Card" (simulating emails, physical encounters, or device interactions). They must choose an action **and** type a brief explanation of *why* they chose it. The system then evaluates both their action and reasoning, providing personalized coaching grounded in real-world cybersecurity frameworks.

---

## 3. Core Architecture & Tech Stack

The architecture is designed for speed, AI integration, and B2B SaaS scalability.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React) + Tailwind | Provides a modern, responsive dashboard and dynamic "Context Card" UI. |
| **Backend** | FastAPI (Python) | The asynchronous orchestrator handling data flow between UI, DB, and AI. |
| **Relational DB** | Supabase (PostgreSQL) | Stores user profiles, scores, difficulty tracking, and auth logic (RLS). |
| **Vector DB** | Supabase (pgvector) | Stores mathematical embeddings of our RAG knowledge bases. |
| **LLM Layer** | OpenAI API (GPT-4o) | Generates scenarios and handles advanced reasoning evaluation. |
| **Embeddings** | SentenceTransformers | Converts NIST/NCSC rules into vectors for semantic search in pgvector. |
| **NLP (Privacy)**| spaCy | Performs Named Entity Recognition (NER) to extract threats and mask PII. |

---

## 4. Multi-Agent System Design

The system utilizes three distinct AI agents orchestrated by FastAPI. They do not communicate directly, ensuring strict boundary control.

### A. The Scenario Agent (Contextual Realism)
*   **Role:** Generates the threat scenario.
*   **How it works:** It queries the `org_knowledge` RAG database (containing uploaded company workflows and CEO names). It generates a hyper-realistic scenario tailored to the specific employee's job, ensuring the threat feels like a real day at the office.

### B. The Evaluation Agent (Reasoning-Aware Scoring)
*   **Role:** Objectively scores the user's decision and reasoning.
*   **How it works:** It operates in two steps. First, it uses **spaCy** to extract hard threat indicators (e.g., spoofed domains, financial requests). Second, it uses a strict prompt rubric to score the user based on whether they exhibited safe behaviors, ignoring their job title to ensure fairness.

### C. The Coach Agent (Evidence-Based Feedback)
*   **Role:** Delivers actionable feedback and sets the next difficulty level.
*   **How it works:** It queries the `cyber_training` RAG database (containing NIST and NCSC guidelines). It provides personalized feedback that explicitly cites the real-world principle the user violated (e.g., *"You failed to verify via phone, violating NIST SP 800-50"*), eliminating AI hallucinations.

---

## 5. Key Differentiators (Competitor Contrast)
Unlike legacy systems (**KnowBe4**) which rely on static videos, or automation systems (**Hoxhunt**) which only track click-rates, CyberGuard AI offers three unique advantages:
1.  **Organizational RAG:** Training adapts to the company's actual internal workflows.
2.  **Reasoning-Aware NLP:** We evaluate *why* a user made a choice, not just the choice itself.
3.  **Traceable Coaching:** Feedback is mathematically linked via pgvector to trusted cybersecurity frameworks, not guessed by an LLM.

---

## 6. Responsible AI (RAI) Plan

*   **Privacy & Data Protection:** We use **spaCy** as a sanitization layer to mask PII (emails, names) before data hits the LLM. Multi-tenancy is enforced via PostgreSQL Row Level Security (RLS) to ensure Company A cannot access Company B's data. Zero-retention enterprise LLM APIs guarantee prompts are not used for model training.
*   **Transparency & Explainability:** "Black box" scoring is eliminated by forcing the Coach Agent to output strict JSON containing citations to the RAG database, ensuring the user always knows *why* they received a certain score.
*   **Fairness:** The Evaluation Agent utilizes a rigid scoring rubric focused purely on the presence or absence of safe behaviors, preventing bias against specific job titles.
*   **Preventing Weaponization:** The platform is strictly sandboxed. System prompts explicitly forbid the generation of actual malicious payloads or connections to SMTP servers, preventing the tool from being used for Phishing-as-a-Service.

---

## 7. Commercialization Strategy
CyberGuard AI is structured as a B2B SaaS product.
*   **Target Market:** Small-to-Medium Enterprises (SMEs) and Managed Service Providers (MSPs) who need effective security training but lack massive enterprise SOC budgets.
*   **Pricing Model:** A tiered subscription model. 
    *   *Starter ($3/user/mo)*: Basic scenarios.
    *   *Professional ($6/user/mo)*: Unlocks the core differentiator—custom `org_knowledge` RAG integration.
*   **Go-to-Market:** Partnering with MSPs allows us to scale rapidly by selling to IT providers who then deploy the software to their entire portfolio of small business clients simultaneously.
