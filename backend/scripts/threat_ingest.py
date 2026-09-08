"""
threat_ingest.py — Cyber Threat Intelligence Ingestion Script
CyberGuard AI · cyber_threats vector table

Usage:
    1. Fill in backend/scripts/data/threat_chunks.json with your extracted chunks.
    2. Run:  python backend/scripts/threat_ingest.py
    3. Check Supabase dashboard to confirm rows were inserted.

See: docs/KNOWLEDGE_BASE_SOURCES.md for which sources to extract from.
"""

import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

load_dotenv()

OPENAI_API_KEY     = os.environ.get("OPENAI_API_KEY")
SUPABASE_URL       = os.environ.get("SUPABASE_URL")
SUPABASE_KEY       = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # must bypass RLS
EMBEDDING_MODEL    = "text-embedding-3-small"   # 1536 dimensions, matches your schema
TARGET_TABLE       = "cyber_threats"

DATA_FILE = Path(__file__).parent / "data" / "threat_chunks.json"

# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

if not all([OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Missing environment variables. Check your backend/.env file.")
    exit(1)

openai_client: OpenAI = OpenAI(api_key=OPENAI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_CATEGORIES = {"threat_definition", "attack_pattern", "incident_report"}

def validate_chunk(chunk: dict, index: int) -> bool:
    """
    Validates a single chunk from threat_chunks.json.
    Returns True if valid, False if it should be skipped.
    """
    if "content" not in chunk or not chunk["content"].strip():
        print(f"   ⚠️  Chunk #{index}: Missing 'content'. Skipping.")
        return False

    if "category" not in chunk or chunk["category"] not in VALID_CATEGORIES:
        print(f"   ⚠️  Chunk #{index}: Invalid category '{chunk.get('category')}'. "
              f"Must be one of: {VALID_CATEGORIES}. Skipping.")
        return False

    word_count = len(chunk["content"].split())
    if word_count < 10:
        print(f"   ⚠️  Chunk #{index}: Content too short ({word_count} words). Skipping.")
        return False

    if word_count > 150:
        print(f"   ⚠️  Chunk #{index}: Content too long ({word_count} words). "
              "Consider splitting this chunk.")
        # Still allows it — just warns

    return True


def get_embedding(text: str) -> list[float]:
    """Calls OpenAI to generate a 1536-dimension embedding vector."""
    try:
        response = openai_client.embeddings.create(
            input=text.strip(),
            model=EMBEDDING_MODEL,
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"      ❌ OpenAI embedding error: {e}")
        return []


def chunk_already_exists(content: str) -> bool:
    """
    Checks if an identical content string is already in the table.
    Prevents duplicates when the script is re-run.
    """
    try:
        result = (
            supabase.table(TARGET_TABLE)
            .select("id")
            .eq("content", content)
            .limit(1)
            .execute()
        )
        return len(result.data) > 0
    except Exception as e:
        print(f"      ⚠️  Duplicate check failed: {e}")
        return False  # Assume not duplicate if check fails


def insert_chunk(chunk: dict, embedding: list[float]) -> bool:
    """Inserts a single chunk with its embedding into Supabase."""
    row = {
        "category":  chunk["category"],
        "content":   chunk["content"].strip(),
        "source":    chunk.get("metadata", {}).get("source", "Unknown"),
        "embedding": embedding,
        "metadata":  chunk.get("metadata", {}),
    }
    try:
        supabase.table(TARGET_TABLE).insert(row).execute()
        return True
    except Exception as e:
        print(f"      ❌ Insert failed: {e}")
        return False

# ---------------------------------------------------------------------------
# Main ingestion loop
# ---------------------------------------------------------------------------

def run_ingestion():
    print("=" * 55)
    print("🛡️  CyberGuard AI — Threat Intelligence Ingestion")
    print(f"   Table:  {TARGET_TABLE}")
    print(f"   Source: {DATA_FILE}")
    print("=" * 55)

    # 1. Load chunks from JSON
    if not DATA_FILE.exists():
        print(f"\n❌ Data file not found: {DATA_FILE}")
        print("   Create the file at: backend/scripts/data/threat_chunks.json")
        print("   See the extraction guide for the expected JSON format.")
        exit(1)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        chunks: list[dict] = json.load(f)

    print(f"\n📂 Loaded {len(chunks)} chunks from {DATA_FILE.name}")

    # 2. Process each chunk
    inserted = 0
    skipped_invalid = 0
    skipped_duplicate = 0
    failed = 0

    for i, chunk in enumerate(chunks, start=1):
        content_preview = chunk.get("content", "")[:60].replace("\n", " ")
        print(f"\n[{i}/{len(chunks)}] {content_preview}...")

        # Validate
        if not validate_chunk(chunk, i):
            skipped_invalid += 1
            continue

        # Check duplicate
        if chunk_already_exists(chunk["content"]):
            print(f"   ⏭️  Already in DB — skipping duplicate.")
            skipped_duplicate += 1
            continue

        # Embed
        embedding = get_embedding(chunk["content"])
        if not embedding:
            print(f"   ❌ Embedding failed — skipping.")
            failed += 1
            continue

        # Insert
        if insert_chunk(chunk, embedding):
            print(f"   ✅ Inserted ({chunk['category']})")
            inserted += 1
        else:
            failed += 1

        # Brief pause to respect OpenAI rate limits (3 requests/sec on free tier)
        time.sleep(0.35)

    # 3. Summary
    print("\n" + "=" * 55)
    print("📊 Ingestion Complete")
    print(f"   ✅ Inserted:          {inserted}")
    print(f"   ⏭️  Skipped (dup):     {skipped_duplicate}")
    print(f"   ⚠️  Skipped (invalid): {skipped_invalid}")
    print(f"   ❌ Failed:            {failed}")
    print("=" * 55)

    if inserted > 0:
        print(f"\n🎉 {inserted} new threat chunks are now in your vector DB.")
        print("   The Evaluation Agent will use them on next query.")
    else:
        print("\n⚠️  No new chunks were inserted. Check warnings above.")


if __name__ == "__main__":
    run_ingestion()
