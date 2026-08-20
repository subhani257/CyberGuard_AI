# 🛠️ CyberGuard AI — Full Technology Stack

This is the definitive technology stack for CyberGuard AI, chosen specifically to balance rapid prototyping for your university project with the scalability required for a real-world SaaS product.

You can use this exact breakdown for your Mid-Evaluation Presentation architecture slide.

---

## 1. Frontend (User Interface)
*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Shadcn UI (for clean, accessible, modern dashboard components)
*   **Why we chose it:** Next.js is the industry standard for modern web apps. It allows for fast, responsive interfaces, which is crucial when presenting interactive cybersecurity scenarios and dashboards to the user.

## 2. Backend (The Orchestrator)
*   **Framework:** FastAPI
*   **Language:** Python 3.12
*   **Why we chose it:** FastAPI is asynchronous and incredibly fast. It is explicitly designed for building APIs and integrates seamlessly with modern Python AI libraries (like `langchain` and `openai`). It acts as the "orchestrator" that passes data between the frontend, the databases, and the AI agents.

## 3. Database Layer (Unified in Supabase)
We are using **Supabase** to handle all database needs in one unified PostgreSQL instance, rather than splitting it across multiple complex services.

*   **Relational Data:** PostgreSQL
    *   *What it stores:* User profiles, roles, score histories, generated scenarios, and training session logs.
*   **Vector Database (RAG):** pgvector (a PostgreSQL extension)
    *   *What it stores:* The chunked and embedded knowledge bases (`org_knowledge`, `cyber_threats`, `cyber_training`).
*   **Authentication:** Supabase Auth (handles login, JWT tokens, and Row Level Security for data isolation).
*   **Why we chose it:** It provides enterprise-grade PostgreSQL with built-in vector search, eliminating the need to manage a separate vector database like Pinecone or ChromaDB.

## 4. Artificial Intelligence (The Agents)
*   **LLM Provider:** OpenAI API (GPT-4o / GPT-4o-mini)
    *   *Note for development:* We can seamlessly swap to Groq (Llama 3) for free local development, as their APIs are identically structured.
*   **Framework:** Native Python API calls (or lightweight LangChain wrappers for RAG).
*   **Embeddings Model:** OpenAI `text-embedding-3-small` (used to convert text documents into vectors for the pgvector database).

## 5. Deployment & Infrastructure
*   **Containerization:** Docker
    *   *Why we chose it:* Ensures the FastAPI backend and Next.js frontend run identically on your laptop, the evaluator's machine, and in the cloud.
*   **Version Control:** Git & GitHub (for team collaboration and code management).

---

## 🎯 The Tech Stack Flow (How it connects)

1.  **Kasun (User)** logs in via the **Next.js** frontend (authenticated by **Supabase Auth**).
2.  The frontend makes an HTTP request to the **FastAPI** backend to start a session.
3.  **FastAPI** queries **PostgreSQL** to get Kasun's role and past scores.
4.  **FastAPI** constructs a prompt and calls the **OpenAI API** (Scenario Agent) to generate the attack.
5.  When Kasun answers, **FastAPI** queries **pgvector** to find the relevant NIST/NCSC guidelines.
6.  **FastAPI** sends Kasun's answer + the pgvector guidelines to the **OpenAI API** (Evaluation/Coach Agents).
7.  The final score is saved back to **PostgreSQL**, and the **Next.js** dashboard updates instantly.
