import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

# Load environment variables from backend/.env
load_dotenv()

# Initialize OpenAI Client
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Initialize Supabase Client
# IMPORTANT: You MUST use the SUPABASE_SERVICE_ROLE_KEY because our tables
# have zero public RLS policies. The service role key bypasses RLS.
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def get_embedding(text: str) -> list[float]:
    """Generates an embedding vector using OpenAI's small embedding model."""
    try:
        response = openai_client.embeddings.create(
            input=text,
            model="text-embedding-3-small" # Fast, cheap, and generates 1536 dimensions
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Error generating embedding: {e}")
        return []

def seed_knowledge_base(table_name: str, records: list[dict]):
    """Embeds and uploads a list of records to the specified Supabase pgvector table."""
    print(f"\n🚀 Seeding {table_name}...")
    
    for record in records:
        content = record['content']
        category = record['category']
        metadata = record.get('metadata', {})
        
        print(f"   -> Embedding: '{content[:50]}...'")
        embedding = get_embedding(content)
        
        if not embedding:
            continue
            
        data = {
            "content": content,
            "category": category,
            "metadata": metadata,
            "embedding": embedding
        }
        
        try:
            # Upsert based on the content to avoid duplicates if run multiple times
            supabase.table(table_name).insert(data).execute()
            print(f"      ✅ Inserted successfully.")
        except Exception as e:
            print(f"      ❌ Failed to insert: {e}")

if __name__ == "__main__":
    
    # -------------------------------------------------------------
    # 1. ORG KNOWLEDGE (For the Scenario Agent)
    # Context about the company's internal policies and hierarchy
    # -------------------------------------------------------------
    org_data = [
        {
            "category": "policy",
            "content": "FIN-SEC-04: All urgent wire transfers exceeding $10,000 must be verified via a secondary communication channel (phone call to known number or in-person). Email approvals are not sufficient, even if sent by the CEO.",
            "metadata": {"source": "NovaTech Employee Handbook 2026", "department": "Finance"}
        },
        {
            "category": "policy",
            "content": "HR-SEC-02: Identity Verification for Payroll. Employees requesting changes to direct deposit must verify their identity by providing their employee ID and confirming via their registered secondary phone number. Do not reply directly to the request email.",
            "metadata": {"source": "NovaTech HR Policy"}
        },
        {
            "category": "workflow",
            "content": "IT support will NEVER ask for your password or MFA code via email. Official IT requests are routed through the internal Jira Service Desk portal.",
            "metadata": {"source": "IT Security Policy v2"}
        }
    ]

    # -------------------------------------------------------------
    # 2. CYBER THREATS (For the Evaluation Agent)
    # Technical attack patterns and real-world indicators (Sourced from CISA/FBI)
    # -------------------------------------------------------------
    threat_data = [
        {
            "category": "threat_definition",
            "content": "Business Email Compromise (BEC): An attacker spoofs or compromises an executive's email account to request fraudulent wire transfers or W-2 information. Indicators include high urgency, demands for secrecy, and sudden changes in payment details.",
            "metadata": {"source": "FBI IC3 Report 2025", "url": "ic3.gov/AnnualReport"}
        },
        {
            "category": "attack_pattern",
            "content": "Spear-Phishing: Highly targeted phishing attempts that use personalized information (e.g., referencing a recent company event or an employee's specific role) to trick the victim into clicking a malicious link or downloading malware.",
            "metadata": {"source": "CISA Phishing Guidance", "url": "cisa.gov/stopransomware"}
        },
        {
            "category": "attack_pattern",
            "content": "MFA Fatigue / Prompt Bombing: Attackers spam a user with Multi-Factor Authentication push notifications in the middle of the night, hoping the user approves it out of frustration just to stop the noise.",
            "metadata": {"source": "CISA Advisory"}
        }
    ]

    # -------------------------------------------------------------
    # 3. CYBER TRAINING (For the Coach Agent)
    # Pedagogical approaches and behavioral correction (Sourced from CISA/NIST)
    # -------------------------------------------------------------
    training_data = [
        {
            "category": "best_practice",
            "content": "CISA 'Recognize, Resist, Delete' Framework: Recognize red flags like urgent/threatening language. Resist the urge to click links or download attachments; always verify out-of-band. Delete the suspicious email immediately without replying or clicking 'unsubscribe'.",
            "metadata": {"source": "CISA Secure Our World Initiative"}
        },
        {
            "category": "best_practice",
            "content": "When dealing with 'urgency' signals in emails, the best defense is to 'Slow Down'. Attackers use artificial urgency to bypass logical thinking and force immediate action.",
            "metadata": {"source": "SANS Security Awareness"}
        },
        {
            "category": "behavioral_guidance",
            "content": "If a user falls for a phishing simulation, do not shame them. Explain *why* the lure worked (e.g., 'The attacker used authority to make you nervous') and show them the exact missing clue. Focus on positive reinforcement.",
            "metadata": {"source": "NIST SP 800-50"}
        },
        {
            "category": "behavioral_guidance",
            "content": "Do not simply label user actions as 'wrong'. If a user attempted verification but used the wrong channel (e.g. replying to the scammer), praise the instinct to verify but correct the execution.",
            "metadata": {"source": "CyberGuard Pedagogical Guidelines"}
        }
    ]

    print("=========================================")
    print("🧠 Initializing CyberGuard AI Vector Seed")
    print("=========================================")
    
    seed_knowledge_base("org_knowledge", org_data)
    seed_knowledge_base("cyber_threats", threat_data)
    seed_knowledge_base("cyber_training", training_data)
    
    print("\n🎉 All vector knowledge bases seeded successfully!")
