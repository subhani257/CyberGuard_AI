import os
import json
import uuid
from typing import List
from dotenv import load_dotenv
from supabase import create_client

# Load environment
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

print(f"Connecting to Supabase: {supabase_url}")
supabase = create_client(supabase_url, supabase_key)

# Initialize SentenceTransformer
print("Loading embedding model (all-MiniLM-L6-v2)...")
from sentence_transformers import SentenceTransformer
hf_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_embedding(text: str) -> List[float]:
    """Generate 1536-dimensional vector embedding."""
    raw = hf_model.encode(text).tolist()
    if len(raw) < 1536:
        return raw + [0.0] * (1536 - len(raw))
    return raw[:1536]

def seed_cyber_training():
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'cyber_training.json')
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Training dataset not found at {json_path}")

    with open(json_path, 'r', encoding='utf-8') as f:
        training_records = json.load(f)

    print(f"Loaded {len(training_records)} training playbooks from {json_path}")

    # Optional: Clear existing training records to avoid duplicate accumulation
    try:
        supabase.table("cyber_training").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Cleared existing cyber_training entries.")
    except Exception as e:
        print(f"Notice during cyber_training cleanup: {e}")

    inserted_count = 0
    fallback_used = False

    for idx, item in enumerate(training_records, 1):
        content = item.get("content", "")
        category = item.get("category", "general_defense")
        channel = item.get("channel", "email")
        target_risk_surface = item.get("target_risk_surface", "general")
        source = item.get("source", "Standard Security Framework")
        metadata = item.get("metadata", {})
        metadata["channel"] = channel
        metadata["target_risk_surface"] = target_risk_surface

        # Compute semantic embedding
        embed_text = f"Category: {category} | Channel: {channel} | Risk Surface: {target_risk_surface} | {content}"
        vector = get_embedding(embed_text)

        # 1. Try full schema with dedicated 'channel' and 'target_risk_surface' columns
        row = {
            "category": category,
            "channel": channel,
            "target_risk_surface": target_risk_surface,
            "source": source,
            "content": content,
            "embedding": vector,
            "metadata": metadata
        }

        try:
            supabase.table("cyber_training").insert(row).execute()
            inserted_count += 1
            print(f"[{idx}/{len(training_records)}] Ingested & Vectorized: {category} ({channel})")
        except Exception as err:
            # 2. Fallback if schema doesn't have 'channel' column yet
            fallback_row = {
                "category": category,
                "source": source,
                "content": content,
                "embedding": vector,
                "metadata": metadata
            }
            try:
                supabase.table("cyber_training").insert(fallback_row).execute()
                inserted_count += 1
                fallback_used = True
                print(f"[{idx}/{len(training_records)}] Ingested (Metadata Fallback): {category} ({channel})")
            except Exception as err2:
                print(f"Error inserting record {idx} ({category}): {err2}")

    print(f"\n[OK] Successfully seeded and vectorized {inserted_count}/{len(training_records)} training playbooks into Supabase 'public.cyber_training' table.")
    if fallback_used:
        print("Note: Ingested with metadata fallback. Please execute backend/database/schema.sql in Supabase SQL Editor to add dedicated 'channel' and 'target_risk_surface' columns.")

if __name__ == "__main__":
    seed_cyber_training()
