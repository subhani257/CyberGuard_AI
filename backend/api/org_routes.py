import os
import io
import re
import uuid
import hashlib
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
import pypdf
from security.auth_bearer import get_current_user, get_optional_current_user, CurrentUser
from nlp.ner import sanitize_input

try:
    from backend.rag.policy_extractor import extract_policy_rules, format_rule_for_embedding
except ImportError:
    from rag.policy_extractor import extract_policy_rules, format_rule_for_embedding

try:
    from backend.rag.retrieval import DEFAULT_ORG_KNOWLEDGE
except ImportError:
    try:
        from rag.retrieval import DEFAULT_ORG_KNOWLEDGE
    except ImportError:
        DEFAULT_ORG_KNOWLEDGE = []


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
    from sentence_transformers import SentenceTransformer  # type: ignore
    hf_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    print(f"Notice: Hugging Face model load deferred in org_routes: {e}")


def get_local_embedding(text: str) -> List[float]:
    """Generate MiniLM vectors, or a deterministic offline lexical vector."""
    global hf_model
    if hf_model is None:
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            hf_model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            # This fallback keeps policy ingestion usable for a local demo.
            # It is not semantically comparable to the MiniLM database corpus.
            lexical = [0.0] * 1536
            for token in re.findall(r"[a-z0-9]+", text.lower()):
                digest = hashlib.sha256(token.encode("utf-8")).digest()
                index = int.from_bytes(digest[:4], "big") % 1536
                lexical[index] += 1.0
            return lexical

    raw = hf_model.encode(text).tolist()
    if len(raw) < 1536:
        return raw + [0.0] * (1536 - len(raw))
    return raw


def chunk_text(text: str, max_words: int = 250) -> List[str]:
    """
    Chunks policy documents into atomic semantic rules.
    Preserves each individual policy section (e.g., TCG-FIN-01, TCG-FIN-02, TCG-SEC-05)
    as its own distinct vector chunk instead of collapsing multiple rules together.
    """
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    header_prefix = ""
    chunks = []

    for p in paragraphs:
        # If paragraph is a title header like [COMPANY NAME ...], retain as contextual prefix
        if re.match(r'^\[[^\]]+\]$', p) and len(p.split()) <= 15:
            header_prefix = p
            continue

        word_count = len(p.split())
        # If an individual rule paragraph is very long (> max_words), split by sentences
        if word_count > max_words:
            sentences = re.split(r'(?<=[.!?])\s+', p)
            current = []
            current_len = 0
            for s in sentences:
                s_len = len(s.split())
                if current_len + s_len > max_words and current:
                    chunk_body = " ".join(current)
                    chunks.append(f"{header_prefix} {chunk_body}".strip())
                    current = [s]
                    current_len = s_len
                else:
                    current.append(s)
                    current_len += s_len
            if current:
                chunk_body = " ".join(current)
                chunks.append(f"{header_prefix} {chunk_body}".strip())
        else:
            # Keep each individual policy rule as its own atomic vector chunk
            chunks.append(f"{header_prefix} {p}".strip())

    if not chunks and text.strip():
        chunks = [text.strip()]

    return [c for c in chunks if len(c.split()) >= 6]


# In-memory store for custom policies when running offline or testing
CUSTOM_ORG_POLICIES_CACHE: Dict[str, List[Dict[str, Any]]] = {}


@router.post("/onboard-policy")
async def onboard_organization_policy(
    user_id: Optional[str] = Form(None),
    company_name: str = Form(...),
    department: str = Form(...),
    role_title: str = Form(...),
    role_description: Optional[str] = Form(None),
    policy_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user)
):
    """
    Ingest, parse, chunk, embed, and store an organization's custom security policies.
    Supports PDF document upload or raw text submission.
    Embeds with local Hugging Face all-MiniLM-L6-v2 and stores in public.org_knowledge.
    """
    if supabase and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required for policy persistence")
    user_id = current_user.id if current_user else (user_id or "default-user")
    if current_user and current_user.company not in ("", "Your Organization"):
        company_name = current_user.company
    raw_text = ""
    source_label = "Direct Text Submission"

    # 1. Process uploaded file (PDF, TXT, MD) if provided
    if file:
        source_label = file.filename
        try:
            file_bytes = await file.read()
            if len(file_bytes) > 2 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Policy file exceeds the 2 MB assignment limit")
            suffix = os.path.splitext(file.filename or "")[1].lower()
            if suffix not in {".pdf", ".txt", ".md"}:
                raise HTTPException(status_code=415, detail="Only PDF, TXT, and Markdown policy files are supported")
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
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse uploaded document: {str(e)}")

    # 2. Append or use direct policy text
    if policy_text and policy_text.strip():
        if raw_text:
            raw_text = raw_text + "\n\n" + policy_text.strip()
        else:
            raw_text = policy_text.strip()

    if len(raw_text) > 100_000:
        raise HTTPException(status_code=413, detail="Policy text exceeds the 100,000 character assignment limit")

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

    # 4. Mask personal data before external LLM extraction or database storage.
    sanitized_policy = sanitize_input(raw_text)
    extraction_trace = {}
    extracted_rules = extract_policy_rules(sanitized_policy, company_name=company_name, department=department, trace=extraction_trace)
    if not extracted_rules:
        fallback_chunks = chunk_text(sanitized_policy)
        extracted_rules = [
            {
                "rule_code": f"{company_name[:3].upper()}-{department[:3].upper()}-{idx+1:02d}",
                "title": f"{department} Standard Rule {idx+1}",
                "department": department,
                "enforcement_level": "MANDATORY",
                "rule_summary": c[:140],
                "full_text": c,
                "trigger_keywords": []
            }
            for idx, c in enumerate(fallback_chunks)
        ]

    # 5. Embed each structured rule locally with Hugging Face and store in Supabase
    ingested_records = []
    persisted_rule_ids = []
    for rule in extracted_rules:
        formatted_content = format_rule_for_embedding(rule, company_name=company_name)
        vector = get_local_embedding(formatted_content)
        metadata = {
            "organization": company_name,
            "department": rule.get("department", department),
            "user_id": user_id,
            "role": role_title,
            "source": source_label,
            "is_custom_org": True,
            "rule_code": rule.get("rule_code"),
            "title": rule.get("title"),
            "enforcement_level": rule.get("enforcement_level"),
            "trigger_keywords": rule.get("trigger_keywords", [])
        }
        metadata["embedding_model"] = "all-MiniLM-L6-v2" if hf_model is not None else "offline-keyword-only"

        record = {
            "category": rule.get("department", department).lower(),
            "content": formatted_content,
            "embedding": vector if hf_model is not None else None,
            "metadata": metadata
        }

        ingested_records.append(record)

        if supabase:
            try:
                insert_res = supabase.table("org_knowledge").insert(record).execute()
                if not insert_res.data:
                    raise RuntimeError("Policy insert returned no record")
                persisted_rule_ids.append(str(insert_res.data[0]["id"]))
            except Exception as e:
                raise HTTPException(status_code=503, detail="Policy persistence failed") from e

    if supabase:
        try:
            supabase.table("agent_audit_logs").insert({
                "agent_name": "PolicyExtractor",
                "user_id": user_id,
                "action": "EXTRACT_ORG_POLICIES",
                "details": {
                    "input": {"company": company_name, "department": department,
                              "source": source_label, "sanitized_document": sanitized_policy},
                    "output": {"rules": extracted_rules, "org_knowledge_ids": persisted_rule_ids},
                    "agent_trace": [{"node": "policy_extractor", **extraction_trace}],
                },
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=503, detail="Policy extraction audit failed") from e

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
            raise HTTPException(status_code=503, detail="Policy owner update failed")

    return {
        "success": True,
        "organization": company_name,
        "department": department,
        "role": role_title,
        "source": source_label,
        "rules_extracted": len(extracted_rules),
        "chunks_ingested": len(extracted_rules),
        "extracted_rules": [
            {
                "rule_code": r.get("rule_code"),
                "title": r.get("title"),
                "summary": r.get("rule_summary"),
                "enforcement_level": r.get("enforcement_level")
            }
            for r in extracted_rules
        ],
        "message": f"Successfully extracted and vectorized {len(extracted_rules)} policy rules for {company_name} using local Hugging Face embeddings."
    }



@router.get("/policies/{company_or_user_id}")
def get_custom_policies(
    company_or_user_id: str,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user)
):
    """
    Retrieve structured organizational security policies.
    Returns custom uploaded rules if present, otherwise falls back to curated baseline policies.
    """
    user_id = current_user.id if current_user else None
    org_name = (
        (current_user.company if current_user and current_user.company not in ("", "Your Organization") else None)
        or (company_or_user_id if company_or_user_id not in ("", "Your Organization", "default") else "NovaTech Solutions")
    )

    # 1. Look up custom cached policies by user id, company name, or parameter
    policies = []
    policy_source = "baseline"
    lookup_keys = [k for k in [user_id, org_name.lower(), company_or_user_id.lower()] if k]
    if not supabase:
        for k in lookup_keys:
            if k in CUSTOM_ORG_POLICIES_CACHE and CUSTOM_ORG_POLICIES_CACHE[k]:
                policies = CUSTOM_ORG_POLICIES_CACHE[k]
                policy_source = "memory"
                break

    # 2. Check Supabase if connected and not found in memory
    if supabase:
        try:
            if user_id:
                res = supabase.table("org_knowledge").select("content, metadata, category").contains("metadata", {"user_id": user_id}).execute()
                if res.data:
                    policies = res.data
            if not policies and org_name:
                res = supabase.table("org_knowledge").select("content, metadata, category").contains("metadata", {"organization": org_name}).execute()
                if res.data:
                    policies = res.data
        except Exception as e:
            raise HTTPException(status_code=503, detail="Policy database retrieval failed") from e
        if policies:
            policy_source = "database"

    # 3. Format structured rules
    structured_rules = []
    if policies:
        for idx, p in enumerate(policies):
            meta = p.get("metadata") or {}
            content = p.get("content", "")
            rule_code = meta.get("rule_code") or meta.get("policy_id") or f"RULE-{idx+1:02d}"
            title = meta.get("title") or f"{meta.get('department', 'Security')} Policy Rule"
            enforcement = meta.get("enforcement_level") or "MANDATORY"
            dept = meta.get("department") or p.get("category", "General").capitalize()
            summary = meta.get("rule_summary") or (content[:140] + ("..." if len(content) > 140 else ""))
            keywords = meta.get("trigger_keywords") or []
            source = meta.get("source", "Uploaded Document")

            structured_rules.append({
                "rule_code": rule_code,
                "title": title,
                "enforcement_level": enforcement,
                "department": dept,
                "summary": summary,
                "content": content,
                "full_text": content,
                "trigger_keywords": keywords,
                "source": source,
                "is_custom": True
            })
    else:
        # Fall back to default organizational knowledge (NovaTech baseline)
        for idx, item in enumerate(DEFAULT_ORG_KNOWLEDGE):
            meta = item.get("metadata") or {}
            content = item.get("content", "")
            rule_code = meta.get("policy_id") or f"TCG-{idx+1:02d}"
            title = item.get("title") or meta.get("title") or f"{meta.get('department', 'Corporate')} Policy"
            dept = meta.get("department") or item.get("category", "General").capitalize()
            summary = content[:140] + ("..." if len(content) > 140 else "")

            structured_rules.append({
                "rule_code": rule_code,
                "title": title,
                "enforcement_level": "MANDATORY" if ("FIN" in rule_code or "SEC" in rule_code) else "STANDARD",
                "department": dept,
                "summary": summary,
                "content": content,
                "full_text": content,
                "trigger_keywords": [dept.lower(), "verification", "compliance"],
                "source": meta.get("source", "NovaTech Corporate Security Baseline"),
                "is_custom": False
            })

    return {
        "success": True,
        "source": policy_source,
        "count": len(structured_rules),
        "organization": org_name,
        "rules": structured_rules,
        "policies": [r["content"] for r in structured_rules]
    }


@router.delete("/policies/{rule_code}")
def delete_policy_rule(
    rule_code: str,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user)
):
    """Delete a custom organization policy rule by rule code."""
    # Remove from memory cache
    deleted_count = 0
    for key, items in list(CUSTOM_ORG_POLICIES_CACHE.items()):
        original_len = len(items)
        CUSTOM_ORG_POLICIES_CACHE[key] = [
            p for p in items
            if (p.get("metadata", {}).get("rule_code") != rule_code and
                p.get("metadata", {}).get("policy_id") != rule_code)
        ]
        deleted_count += (original_len - len(CUSTOM_ORG_POLICIES_CACHE[key]))

    # Delete from Supabase if connected
    if supabase:
        try:
            supabase.table("org_knowledge").delete().contains("metadata", {"rule_code": rule_code}).execute()
        except Exception as e:
            print(f"Notice: Supabase delete in org_routes: {e}")

    return {
        "success": True,
        "message": f"Rule '{rule_code}' successfully removed.",
        "rule_code": rule_code
    }

