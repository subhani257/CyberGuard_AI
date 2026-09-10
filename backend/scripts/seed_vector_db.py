import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from sentence_transformers import SentenceTransformer

# Initialize local Hugging Face embedding model (Free, offline CPU inference)
print("[INIT] Loading local Hugging Face model: all-MiniLM-L6-v2...")
hf_model = SentenceTransformer("all-MiniLM-L6-v2")
print("[OK] Hugging Face model loaded successfully (100% free, runs locally).")

# Initialize Supabase Client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    print("[ERROR] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)
DATA_DIR = Path(__file__).resolve().parent / "data"


def get_embedding(text: str) -> list[float]:
    """
    Generates embedding vector locally via Hugging Face all-MiniLM-L6-v2.
    Pads from 384 to 1536 dimensions with zeros to match existing pgvector schema constraint.
    Mathematically, cosine similarity remains identical between identically padded vectors.
    """
    try:
        raw_vector = hf_model.encode(text).tolist()
        if len(raw_vector) < 1536:
            return raw_vector + [0.0] * (1536 - len(raw_vector))
        return raw_vector
    except Exception as e:
        print(f"   [ERROR] Failed to generate local embedding: {e}")
        return []


def load_dataset(filename: str) -> list[dict]:
    """Loads structured JSON chunks from the backend/scripts/data directory."""
    filepath = DATA_DIR / filename
    if not filepath.exists():
        print(f"   [WARN] File not found: {filepath}")
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_knowledge_base(table_name: str, records: list[dict]):
    """Embeds and uploads a list of records to the specified Supabase pgvector table with duplicate checking."""
    print(f"\n=======================================================")
    print(f"[SEED] Seeding Table: {table_name} ({len(records)} records)")
    print(f"=======================================================")

    inserted_count = 0
    skipped_count = 0

    for idx, record in enumerate(records, start=1):
        content = record.get("content", "").strip()
        category = record.get("category", "general")
        metadata = record.get("metadata", {})

        if not content:
            continue

        # Check if record already exists to prevent duplicates
        try:
            existing = supabase.table(table_name).select("id").eq("content", content).limit(1).execute()
            if existing.data and len(existing.data) > 0:
                print(f"   [{idx}/{len(records)}] [SKIP] Already exists: '{content[:45]}...'")
                skipped_count += 1
                continue
        except Exception as e:
            pass

        print(f"   [{idx}/{len(records)}] [EMBED] Generating vector: '{content[:50]}...'")
        embedding = get_embedding(content)

        if not embedding:
            print(f"      [ERROR] Skipping due to embedding failure.")
            continue

        data = {
            "content": content,
            "category": category,
            "metadata": metadata,
            "embedding": embedding
        }
        if table_name in ["cyber_threats", "cyber_training"]:
            data["source"] = record.get("source") or metadata.get("source") or "Official Cybersecurity Guidance"

        try:
            supabase.table(table_name).insert(data).execute()
            print(f"      [OK] Inserted into {table_name}.")
            inserted_count += 1
        except Exception as e:
            print(f"      [ERROR] Failed to insert: {e}")

    print(f"\n[DONE] Completed {table_name}: {inserted_count} new inserted, {skipped_count} skipped (already existing).")


if __name__ == "__main__":
    print("=======================================================")
    print("[INIT] CyberGuard AI Vector Database Ingestion Pipeline")
    print("=======================================================")
    print(f"[INFO] Data Source Directory: {DATA_DIR}")

    # 1. ORG KNOWLEDGE (Member 1 — Scenario Agent RAG)
    org_data = load_dataset("org_knowledge_chunks.json")
    if org_data:
        seed_knowledge_base("org_knowledge", org_data)

    # 2. CYBER THREATS (Member 2 — Evaluation Agent RAG)
    threat_data = load_dataset("threat_chunks.json")
    if threat_data:
        seed_knowledge_base("cyber_threats", threat_data)

    # 3. CYBER TRAINING (Member 3 — Training Coach Agent RAG)
    training_data = load_dataset("training_chunks.json")
    if training_data:
        seed_knowledge_base("cyber_training", training_data)

    print("\n[SUCCESS] All vector knowledge bases processed successfully!")
