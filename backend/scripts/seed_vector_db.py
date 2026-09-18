import os
import sys
import json
import argparse
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

hf_model = None
openai_client = None
ACTIVE_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2-padded-1536"

try:
    from sentence_transformers import SentenceTransformer
    print("[INIT] Loading local Hugging Face model: all-MiniLM-L6-v2...")
    hf_model = SentenceTransformer("all-MiniLM-L6-v2")
    print("[OK] Hugging Face model loaded successfully (local CPU inference).")
except Exception as exc:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "No embedding provider is available. Install sentence-transformers or configure OPENAI_API_KEY."
        ) from exc
    ACTIVE_EMBEDDING_MODEL = "text-embedding-3-small"
    openai_client = OpenAI(api_key=api_key)
    print("[INFO] sentence-transformers unavailable; using OpenAI text-embedding-3-small.")

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
    Generates a 1536-dimensional embedding with the active provider. MiniLM vectors
    are zero-padded; OpenAI text-embedding-3-small already returns 1536 values.
    """
    try:
        if hf_model is not None:
            raw_vector = hf_model.encode(text).tolist()
        else:
            response = openai_client.embeddings.create(model="text-embedding-3-small", input=text)
            raw_vector = response.data[0].embedding
        if len(raw_vector) < 1536:
            return raw_vector + [0.0] * (1536 - len(raw_vector))
        return raw_vector[:1536]
    except Exception as e:
        print(f"   [ERROR] Failed to generate embedding: {e}")
        return []


def load_dataset(filename: str) -> list[dict]:
    """Loads structured JSON chunks from the backend/scripts/data directory."""
    filepath = DATA_DIR / filename
    if not filepath.exists():
        print(f"   [WARN] File not found: {filepath}")
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_knowledge_base(table_name: str, records: list[dict], refresh: bool = False):
    """Embeds and uploads a list of records to the specified Supabase pgvector table with duplicate checking."""
    print(f"\n=======================================================")
    print(f"[SEED] Seeding Table: {table_name} ({len(records)} records)")
    print(f"=======================================================")

    inserted_count = 0
    refreshed_count = 0
    skipped_count = 0

    for idx, record in enumerate(records, start=1):
        content = record.get("content", "").strip()
        category = record.get("category", "general")
        metadata = {**record.get("metadata", {}), "embedding_model": ACTIVE_EMBEDDING_MODEL}

        if not content:
            continue

        # Check if record already exists to prevent duplicates
        existing_id = None
        try:
            existing = supabase.table(table_name).select("id").eq("content", content).limit(1).execute()
            existing_id = existing.data[0]["id"] if existing.data else None
            if existing_id and not refresh:
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
        if table_name == "cyber_training":
            data["channel"] = record.get("channel") or metadata.get("channel") or "email"
            data["target_risk_surface"] = (
                record.get("target_risk_surface")
                or metadata.get("target_risk_surface")
                or "general"
            )

        try:
            if existing_id:
                supabase.table(table_name).update(data).eq("id", existing_id).execute()
                print(f"      [OK] Refreshed in {table_name}.")
                refreshed_count += 1
            else:
                supabase.table(table_name).insert(data).execute()
                print(f"      [OK] Inserted into {table_name}.")
                inserted_count += 1
        except Exception as e:
            print(f"      [ERROR] Failed to insert: {e}")

    print(
        f"\n[DONE] Completed {table_name}: {inserted_count} inserted, "
        f"{refreshed_count} refreshed, {skipped_count} skipped."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed selected CyberGuard pgvector knowledge tables.")
    parser.add_argument(
        "--tables",
        nargs="+",
        choices=["org_knowledge", "cyber_threats", "cyber_training"],
        default=["org_knowledge", "cyber_threats", "cyber_training"],
    )
    parser.add_argument("--refresh", action="store_true", help="Re-embed and update matching records.")
    args = parser.parse_args()

    print("=======================================================")
    print("[INIT] CyberGuard AI Vector Database Ingestion Pipeline")
    print("=======================================================")
    print(f"[INFO] Data Source Directory: {DATA_DIR}")

    # 1. ORG KNOWLEDGE (Member 1 — Scenario Agent RAG)
    if "org_knowledge" in args.tables:
        org_data = load_dataset("org_knowledge_chunks.json")
        if org_data:
            seed_knowledge_base("org_knowledge", org_data, refresh=args.refresh)

    # 2. CYBER THREATS (Member 2 — Evaluation Agent RAG)
    if "cyber_threats" in args.tables:
        threat_data = load_dataset("threat_chunks.json")
        if threat_data:
            seed_knowledge_base("cyber_threats", threat_data, refresh=args.refresh)

    # 3. CYBER TRAINING (Member 3 — Training Coach Agent RAG)
    if "cyber_training" in args.tables:
        training_data = load_dataset("training_chunks.json")
        if training_data:
            seed_knowledge_base("cyber_training", training_data, refresh=args.refresh)

    print("\n[SUCCESS] All vector knowledge bases processed successfully!")
