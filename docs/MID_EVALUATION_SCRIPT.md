# 🎤 CyberGuard AI — Mid-Evaluation Presentation Script & Outline

This document directly answers every single requirement for your Mid-Evaluation today. You can use this as your speaker notes or to structure your slides.

---

## 1. Why you selected the domain
**The Problem:** The current state of cybersecurity training is broken. It consists of generic, boring, yearly multiple-choice quizzes that employees mindlessly click through just for compliance. 
**Why it's important:** Because 95% of all cybersecurity breaches involve the "human element," and Business Email Compromise (BEC) alone cost businesses over $3 billion in 2025.
**Who experiences it:** Organizations of all sizes, but especially SMEs who lack dedicated security teams, and the employees who feel training is irrelevant to their actual jobs.
**Why Agentic AI:** Traditional systems cannot adapt. Agentic AI is the only technology that can read a specific user's organizational context and dynamically generate hyper-realistic, targeted scenarios, while actually evaluating *why* the user made a specific decision.

## 2. Your proposed system
**What we are developing:** CyberGuard AI, an adaptive, multi-agent cybersecurity training platform.
**The problem it solves:** It replaces static compliance checklists with dynamic, role-specific simulations that actually change employee behavior.
**Target Users:** The primary users are employees undergoing training (like a Finance Manager), and IT Admins monitoring organizational risk.
**Value provided:** We provide **Contextual Realism**. By integrating organizational workflows into the AI, the training feels like a real threat the employee might actually face today, leading to genuine learning rather than rote memorization.

## 3. Agents and their roles
Our system uses 3 distinct agents, orchestrated by a central backend. They never talk to each other directly; the backend passes the data between them.
*   **Agent 1: The Scenario Agent.** 
    *   *Role:* Generates the threat.
    *   *How:* It uses RAG on the `org_knowledge` database to create a scenario tailored to the specific employee's role and company culture.
*   **Agent 2: The Evaluation Agent (Security + Evaluator).**
    *   *Role:* Scores the user's decision and reasoning. 
    *   *How:* It uses NLP to identify threat indicators, then uses a strict scoring rubric to objectively score the user based on whether they exhibited safe behaviors (e.g., verifying a sender domain).
*   **Agent 3: The Coach Agent.**
    *   *Role:* Delivers actionable feedback and sets the next difficulty level.
    *   *How:* It uses RAG on the `cyber_training` database (NIST, NCSC guidelines) to provide evidence-based feedback so the user understands exactly *why* they failed.

## 4. Implementation plan
We have a clear, realistic architectural plan designed for rapid prototyping and scalability.
*   **Frontend:** Next.js (React) to provide a modern, responsive dashboard and our flexible "Context Card" UI.
*   **Backend:** FastAPI (Python) acts as the orchestrator. It handles the API requests and controls the flow of data between the frontend, the databases, and the LLM.
*   **Databases:** We use Supabase as a unified layer. PostgreSQL handles relational data (user profiles, score histories). We use **pgvector** as our Vector Database to handle the Information Retrieval (IR) and RAG queries.
*   **AI/NLP:** We utilize OpenAI's API (or Groq) to power the agents, using strict System Prompts and JSON output schemas to ensure the AI behaves predictably and safely.

## 5. Responsible AI plan
We have architected mitigations for the major RAI risks in our domain:
*   **Privacy:** To ensure company data isn't mixed, we use Row Level Security (RLS) in PostgreSQL (Multi-Tenancy) and rely on Enterprise Zero-Retention LLM APIs so organizational data is never used to train public models.
*   **Transparency & Explainability:** To avoid "Black Box AI", our Coach Agent is forced via prompt engineering to cite its sources. Feedback always links back to a trusted framework (e.g., "Violated NIST SP 800-50").
*   **Fairness:** The Evaluation Agent scores users using a strict rubric based purely on the presence of safe behaviors, ensuring a CEO and an intern are judged objectively by the same standard.
*   **Potential Misuse:** To prevent malicious insiders from using the Scenario Agent as a "Phishing-as-a-Service" tool, the system is strictly sandboxed. It generates text for the UI but cannot connect to an SMTP server to send actual emails.

## 6. Commercialization plan
While built as an academic prototype, CyberGuard AI has a clear B2B SaaS trajectory.
*   **Who would use/pay for it:** Small-to-Medium Enterprises (SMEs) and Managed Service Providers (MSPs).
*   **Value Proposition:** We offer what giants like KnowBe4 don't: *Contextual Realism*. Training that adapts to the specific company's workflows.
*   **Revenue Model:** A tiered, per-user/per-month SaaS subscription (e.g., $3/user for Starter, $6/user for Professional which unlocks the custom Org-Context RAG pipeline).
*   **Deployment & GTM:** We will deploy via cloud (Dockerized containers). Our Go-To-Market strategy relies on Product-Led Growth (offering a free tier for 5 employees) and partnering with MSPs who can resell the platform to their entire portfolio of clients.
