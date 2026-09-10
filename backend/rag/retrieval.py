import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Curated repository of NovaTech organizational policies and workflow rules (Member 1 Org Knowledge)
DEFAULT_ORG_KNOWLEDGE = [
    {
        "category": "finance",
        "title": "Wire Transfer Approval Protocol",
        "content": (
            "FIN-SEC-04: All wire transfers exceeding $10,000 require secondary out-of-band verification "
            "(direct phone call to registered internal extension or in-person confirmation) with the CFO or Finance Director. "
            "Email or SMS approvals are strictly prohibited, even if purportedly sent by the CEO. "
            "Company payment information is never transmitted to unverified external email domains."
        ),
        "metadata": {"department": "Finance", "source": "NovaTech Finance SOP 2026", "policy_id": "FIN-SEC-04"}
    },
    {
        "category": "finance",
        "title": "Vendor Account Modification",
        "content": (
            "FIN-SEC-09: Any incoming request to alter bank account details, routing numbers, or payment terms for an existing vendor "
            "must be verified via an established alternate telephone channel on the master vendor file. "
            "Employees are prohibited from acting on payment redirection requests marked 'urgent' without supervisor sign-off."
        ),
        "metadata": {"department": "Finance", "source": "NovaTech Accounts Payable Manual", "policy_id": "FIN-SEC-09"}
    },
    {
        "category": "hr",
        "title": "Employee Payroll & Direct Deposit Protection",
        "content": (
            "HR-SEC-02: Direct deposit modifications and tax form requests require multi-factor verification through the Workday portal. "
            "HR personnel must never update direct deposit bank details based on emailed PDF forms or urgent requests from personal email addresses. "
            "Always verify identity via the employee's registered mobile number."
        ),
        "metadata": {"department": "Human Resources", "source": "NovaTech HR Compliance", "policy_id": "HR-SEC-02"}
    },
    {
        "category": "it",
        "title": "Password & Authentication Security",
        "content": (
            "IT-SEC-03: NovaTech Global IT Support will NEVER request your password, Multi-Factor Authentication (MFA) approval, "
            "or VPN credentials via email, SMS, or Slack. All legitimate password reset requests and system upgrades are scheduled "
            "through jira.novatech-corp.com with an active ticket number."
        ),
        "metadata": {"department": "IT & Security", "source": "NovaTech Information Security Handbook", "policy_id": "IT-SEC-03"}
    },
    {
        "category": "executive",
        "title": "Executive Communications & Out-of-Band Verification",
        "content": (
            "EXEC-SEC-01: NovaTech C-suite executives (including CEO and Directors) will never request urgent purchases of gift cards, "
            "confidential wire transfers, or external file uploads via personal email accounts (e.g. gmail.com, novatech-corp.net). "
            "Any such communication must be reported immediately to the Security Operations Center."
        ),
        "metadata": {"department": "Executive Office", "source": "NovaTech Governance Rules", "policy_id": "EXEC-SEC-01"}
    },
    {
        "category": "general",
        "title": "Domain Spoofing & Phishing Defense",
        "content": (
            "GEN-SEC-01: NovaTech employees must scrutinize sender addresses for look-alike domains (e.g., novatech-corp.net instead of "
            "the official novatech.com). External emails containing urgent requests to download attachments or click credential verification "
            "links must be quarantined using the 'Report Phish' button."
        ),
        "metadata": {"department": "All Employees", "source": "NovaTech Acceptable Use Policy", "policy_id": "GEN-SEC-01"}
    }
]


class OrganizationalRetriever:
    """
    Member 1 IR / RAG Component: Organizational Knowledge Retriever.
    Retrieves internal corporate workflow rules, approval policies, and hierarchy context
    from Supabase pgvector (public.org_knowledge) with resilient local fallbacks.
    """

    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
        self.supabase: Optional[Client] = None
        self.openai_client: Optional[OpenAI] = None

        try:
            if self.supabase_url and "your-project" not in self.supabase_url and self.supabase_key:
                self.supabase = create_client(self.supabase_url, self.supabase_key)
        except Exception as e:
            print(f"Notice: Supabase client in OrganizationalRetriever using local fallback: {e}")

        self.hf_model = None
        try:
            from sentence_transformers import SentenceTransformer
            self.hf_model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            print(f"Notice: Hugging Face model load skipped in OrganizationalRetriever: {e}")

        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key and not api_key.startswith("sk-proj-placeholder"):
            try:
                self.openai_client = OpenAI(api_key=api_key)
            except Exception:
                pass

    def _get_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding vector using local Hugging Face all-MiniLM-L6-v2 (free) with fallback."""
        # 1. Prefer local Hugging Face SentenceTransformer (100% free, offline CPU)
        if self.hf_model:
            try:
                vec = self.hf_model.encode(text).tolist()
                if len(vec) < 1536:
                    return vec + [0.0] * (1536 - len(vec))
                return vec
            except Exception:
                pass

        # 2. Secondary fallback to OpenAI if available
        if self.openai_client:
            try:
                response = self.openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text
                )
                return response.data[0].embedding
            except Exception as e:
                print(f"Notice: OpenAI embedding skipped in OrganizationalRetriever: {e}")

        return None

    def retrieve_context(
        self,
        user_role: str,
        query: Optional[str] = None,
        top_k: int = 2,
        company_name: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve corporate policies relevant to the user's role and target threat scenario.
        Prioritizes user's custom ingested company policies if company_name or user_id is provided.
        """
        # 0. Check custom company policy priority if available
        if company_name or user_id:
            # Check in-memory custom policy cache first
            try:
                from api.org_routes import CUSTOM_ORG_POLICIES_CACHE
                key = (company_name or user_id or "").lower()
                cached = CUSTOM_ORG_POLICIES_CACHE.get(key)
                if cached:
                    return cached[:top_k]
            except Exception:
                pass

            # Check Supabase org_knowledge for custom uploaded policies
            if self.supabase:
                try:
                    query_builder = self.supabase.table("org_knowledge").select("*")
                    if company_name:
                        res = query_builder.contains("metadata", {"organization": company_name}).limit(top_k).execute()
                        if res.data:
                            return res.data
                    if user_id:
                        res = self.supabase.table("org_knowledge").select("*").contains("metadata", {"user_id": user_id}).limit(top_k).execute()
                        if res.data:
                            return res.data
                except Exception:
                    pass

        search_query = f"{company_name or ''} {user_role} {query or 'cybersecurity policy workflow'}".strip()
        
        # 1. Try vector similarity search in Supabase pgvector if available
        if self.supabase:
            embedding = self._get_embedding(search_query)
            if embedding:
                try:
                    res = self.supabase.rpc(
                        'match_org_knowledge',
                        {
                            'query_embedding': embedding,
                            'match_threshold': 0.65,
                            'match_count': top_k
                        }
                    ).execute()
                    if res.data:
                        return res.data
                except Exception:
                    pass

            # Fallback: Query org_knowledge table directly
            try:
                cat_filter = "finance" if "finance" in user_role.lower() else "general"
                res = self.supabase.table("org_knowledge").select("*").ilike("category", f"%{cat_filter}%").limit(top_k).execute()
                if res.data:
                    return res.data
            except Exception:
                pass

        # 2. Resilient local fallback: category + keyword relevance scoring
        role_lower = user_role.lower()
        scored_policies = []
        
        for item in DEFAULT_ORG_KNOWLEDGE:
            score = 0
            category = item["category"]
            content = item["content"].lower()
            
            if "finance" in role_lower and category == "finance":
                score += 10
            elif "hr" in role_lower and category == "hr":
                score += 10
            elif "it" in role_lower and category == "it":
                score += 10
            elif category == "general":
                score += 5

            if query:
                for word in query.lower().split():
                    if word in content:
                        score += 2
                        
            scored_policies.append((score, item))

        scored_policies.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored_policies[:top_k]]


# Convenience function matching the existing Member 1 interface
_default_retriever = OrganizationalRetriever()

def get_org_context(
    user_role: str,
    query: Optional[str] = None,
    top_k: int = 2,
    company_name: Optional[str] = None,
    user_id: Optional[str] = None
) -> str:
    """
    Returns formatted organizational context string for injection into the Scenario Agent LLM prompt.
    """
    records = _default_retriever.retrieve_context(
        user_role,
        query=query,
        top_k=top_k,
        company_name=company_name,
        user_id=user_id
    )
    if not records:
        company_label = company_name or "NovaTech"
        return f"{company_label} Standard Operating Procedure: Mandatory out-of-band verification for all critical communications."
        
    contexts = []
    for r in records:
        content = r.get("content", "")
        metadata = r.get("metadata") or {}
        policy_id = metadata.get("policy_id", "")
        if policy_id:
            contexts.append(f"[{policy_id}] {content}")
        else:
            contexts.append(content)
            
    return "\n".join(contexts)
