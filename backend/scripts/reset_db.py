import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    print("[ERROR] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)


def clear_table(table_name: str):
    """Deletes all rows from a specified table."""
    try:
        # Supabase Python client delete all rows by matching not null id
        res = supabase.table(table_name).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        count = len(res.data) if res.data else 0
        print(f"   [CLEARED] Table '{table_name}': {count} rows deleted.")
    except Exception as e:
        print(f"   [NOTICE] Table '{table_name}' clear attempt: {e}")


def main():
    parser = argparse.ArgumentParser(description="CyberGuard AI Database Reset Utility")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Wipe all tables including vector knowledge bases (org_knowledge, cyber_threats, cyber_training)"
    )
    args = parser.parse_args()

    print("=======================================================")
    print("[INIT] CyberGuard AI Database Reset")
    print("=======================================================")

    # 1. Clear session and decision data
    print("\n--- 1. Clearing User Sessions, Decisions & Scenarios ---")
    clear_table("decisions")
    clear_table("scenarios")
    clear_table("user_learning_profile")
    clear_table("agent_audit_logs")
    clear_table("users")

    # 2. Optionally clear vector knowledge tables
    if args.all:
        print("\n--- 2. Clearing Vector Knowledge Base Tables (--all flag detected) ---")
        clear_table("org_knowledge")
        clear_table("cyber_threats")
        clear_table("cyber_training")
    else:
        print("\n[NOTE] Vector tables (org_knowledge, cyber_threats, cyber_training) were PRESERVED.")
        print("       To wipe vector tables as well, re-run with: python scripts/reset_db.py --all")

    print("\n[SUCCESS] Database reset complete! You have a fresh slate.")
    print("=======================================================")


if __name__ == "__main__":
    main()
