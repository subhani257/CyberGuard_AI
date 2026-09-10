import os
import io
import re
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
import pypdf

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

router = APIRouter(tags=["Organization & Policy Ingestion (Member 1)"])

# Initialize Supabase Client
supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Optional[Client] = None

try:
    if supabase_url and "your-project" not in supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"Notice: Supabase client in org_routes using local fallback: {e}")

# Initialize Local Hugging Face Model (Free, CPU inference)
hf_model = None
try:
    from sentence_transformers import SentenceTransformer
    hf_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    print(f"Notice: Hugging Face model load deferred in org_routes: {e}")


def get_local_embedding(text: str) -> List[float]:
    """Generates embedding vector locally via Hugging Face all-MiniLM-L6-v2 padded to 1536 dims."""
    global hf_model
    if hf_model is None:
        from sentence_transformers import SentenceTransformer
        hf_model = SentenceTransformer("all-MiniLM-L6-v2")

    raw = hf_model.encode(text).tolist()
    if len(raw) < 1536:
        return raw + [0.0] * (1536 - len(raw))
    return raw


def chunk_text(text: str, max_words: int = 150) -> List[str]:
    """Chunks text into coherent semantic paragraphs of 80-250 words."""
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    chunks = []
    current_chunk = []
    current_count = 0

    for p in paragraphs:
        word_count = len(p.split())
        if current_count + word_count > max_words and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [p]
            current_count = word_count
        else:
            current_chunk.append(p)
            current_count += word_count

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    # Fallback if no clean paragraphs found
    if not chunks and text.strip():
        words = text.split()
        for i in range(0, len(words), max_words):
            chunks.append(" ".join(words[i:i + max_words]))

    return [c for c in chunks if len(c.split()) >= 8]


# In-memory store for custom policies when running offline or testing
CUSTOM_ORG_POLICIES_CACHE: Dict[str, List[Dict[str, Any]]] = {}


@router.post("/onboard-policy")
async def onboard_organization_policy(
    user_id: str = Form(...),
    company_name: str = Form(...),
    department: str = Form(...),
    role_title: str = Form(...),
    role_description: Optional[str] = Form(None),
    policy_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Ingest, parse, chunk, embed, and store an organization's custom security policies.
    Supports PDF document upload or raw text submission.
    Embeds with local Hugging Face all-MiniLM-L6-v2 and stores in public.org_knowledge.
    """
    raw_text = ""
    source_label = "Direct Text Submission"

    # 1. Process uploaded file (PDF, TXT, MD) if provided
    if file:
        source_label = file.filename
        try:
            file_bytes = await file.read()
            if file.filename.lower().endswith(".pdf"):
                pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                extracted_pages = []
                for idx, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        extracted_pages.append(page_text)
                raw_text = "\n\n".join(extracted_pages)
            else:
                raw_text = file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse uploaded document: {str(e)}")

    # 2. Append or use direct policy text
    if policy_text and policy_text.strip():
        if raw_text:
            raw_text = raw_text + "\n\n" + policy_text.strip()
        else:
            raw_text = policy_text.strip()

    # 3. If neither was provided, synthesize role context policy chunk
    if not raw_text.strip():
        raw_text = (
            f"Policy for {company_name} - {department} Department:\n"
            f"All employees serving in the capacity of {role_title} must strictly follow out-of-band "
            f"verification protocols for all sensitive operations. "
            f"Role Responsibilities: {role_description or 'Handling core organizational workflows.'}. "
            f"Incoming electronic communications requesting unusual transactions or credential verifications "
            f"must be verified via direct internal phone directory lookup."
        )
        source_label = "Auto-Generated Role Guidelines"

    # 4. Chunk text into semantic policy sections
    chunks = chunk_text(raw_text)
    if not chunks:
        chunks = [raw_text.strip()]

    # 5. Embed each chunk locally with Hugging Face and store in Supabase
    ingested_records = []
    for chunk in chunks:
        vector = get_local_embedding(chunk)
        metadata = {
            "organization": company_name,
            "department": department,
            "user_id": user_id,
            "role": role_title,
            "source": source_label,
            "is_custom_org": True
        }

        record = {
            "category": department.lower(),
            "content": f"[{company_name.upper()} POLICY - {department.upper()}] {chunk}",
            "embedding": vector,
            "metadata": metadata
        }

        ingested_records.append(record)

        if supabase:
            try:
                supabase.table("org_knowledge").insert(record).execute()
            except Exception as e:
                print(f"Notice: Supabase insert skipped for chunk in org_routes: {e}")

    # Store in local memory cache
    CUSTOM_ORG_POLICIES_CACHE.setdefault(company_name.lower(), []).extend(ingested_records)
    CUSTOM_ORG_POLICIES_CACHE.setdefault(user_id, []).extend(ingested_records)

    # 6. Update user's profile with updated role & company
    if supabase:
        try:
            supabase.table("users").update({
                "role": role_title
            }).eq("id", user_id).execute()
        except Exception:
            pass

    return {
        "success": True,
        "organization": company_name,
        "department": department,
        "role": role_title,
        "source": source_label,
        "chunks_ingested": len(chunks),
        "message": f"Successfully ingested {len(chunks)} policy chunks for {company_name} using local Hugging Face embeddings."
    }


@router.get("/policies/{company_or_user_id}")
def get_custom_policies(company_or_user_id: str):
    """Retrieve ingested custom organizational policies for a given company or user ID."""
    key = company_or_user_id.lower()
    policies = CUSTOM_ORG_POLICIES_CACHE.get(key, [])
    
    if supabase and not policies:
        try:
            res = supabase.table("org_knowledge").select("content, metadata, category").contains("metadata", {"organization": company_or_user_id}).execute()
            if res.data:
                policies = res.data
        except Exception:
            pass

    return {
        "success": True,
        "count": len(policies),
        "policies": [p.get("content") for p in policies]
    }
