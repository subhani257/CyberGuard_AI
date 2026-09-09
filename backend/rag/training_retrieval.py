import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Ground-truth NIST SP 800-50 & SANS training guidance repository
DEFAULT_CYBER_TRAINING_MODULES = [
    {
        "category": "urgency_bias",
        "source": "NIST SP 800-50 Sec 3.2",
        "content": (
            "Social engineers leverage psychological time pressure ('Urgent Action Required', '24-hour account suspension') "
            "to inhibit rational scrutiny. Training Directive: Implement an institutional 'Stop & Verify' rule. All requests "
            "demanding immediate fund transfers or password resets must undergo out-of-band telephone or verbal verification."
        ),
        "metadata": {"framework": "NIST", "topic": "Urgency & Psychological Coercion", "level": "foundational"}
    },
    {
        "category": "authority_abuse",
        "source": "SANS Securing The Human - Executive Impersonation",
        "content": (
            "Business Email Compromise (BEC) attackers frequently spoof C-suite executives (CEO, CFO) to exploit compliance "
            "reflexes. Training Directive: Institutional protocol strictly supersedes individual hierarchy. No employee may "
            "bypass mandatory multi-signature authorization regardless of the stated sender title or urgency."
        ),
        "metadata": {"framework": "SANS", "topic": "Authority Cues & BEC Defense", "level": "intermediate"}
    },
    {
        "category": "spoofed_domains",
        "source": "NIST SP 800-50 Sec 3.4",
        "content": (
            "Adversaries employ look-alike domains (typosquatting, e.g. micros0ft.com, paypa1.com) and homograph attacks. "
            "Training Directive: Inspect full RFC-822 Return-Path and envelope sender headers. Never rely solely on display names "
            "or embedded logo imagery."
        ),
        "metadata": {"framework": "NIST", "topic": "Domain Spoofing & Header Analysis", "level": "foundational"}
    },
    {
        "category": "financial_requests",
        "source": "NIST SP 800-16 / SANS Vendor Fraud Defense",
        "content": (
            "Fraudulent invoice modification schemes target accounts payable with sudden bank routing number revisions. "
            "Training Directive: Direct telephone verification using registered master vendor contact numbers is mandatory "
            "before changing wire destinations or issuing single payments exceeding institutional thresholds."
        ),
        "metadata": {"framework": "NIST", "topic": "Accounts Payable & Wire Fraud", "level": "advanced"}
    },
    {
        "category": "credential_harvesting",
        "source": "NIST SP 800-63B",
        "content": (
            "Credential harvesting pages replicate corporate single sign-on (SSO) portals. "
            "Training Directive: Utilize FIDO2/WebAuthn hardware tokens and password managers that cryptographically bind credentials "
            "to verified top-level domains. Never submit enterprise credentials via unsolicited email links."
        ),
        "metadata": {"framework": "NIST", "topic": "Authentication Security & Credential Hygiene", "level": "intermediate"}
    }
]


class TrainingRetriever:
    """
    Retrieves authoritative pedagogical guidance from the cyber_training knowledge base
    using semantic vector search (pgvector) and category matching.
    """

    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase: Optional[Client] = None
        self.openai_client: Optional[OpenAI] = None

        try:
            if self.supabase_url and "your-project" not in self.supabase_url and self.supabase_key:
                self.supabase = create_client(self.supabase_url, self.supabase_key)
        except Exception as e:
            print(f"Notice: Supabase client in TrainingRetriever using local cache fallback: {e}")

        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key and not api_key.startswith("sk-proj-placeholder"):
            try:
                self.openai_client = OpenAI(api_key=api_key)
            except Exception:
                pass

    def _get_embedding(self, text: str) -> Optional[List[float]]:
        if not self.openai_client:
            return None
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Notice: OpenAI embedding generation skipped, using fallback search: {e}")
            return None

    def retrieve_guidance(self, weaknesses: List[str], top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieve relevant NIST / SANS training material matching detected weaknesses.
        """
        if not weaknesses:
            weaknesses = ["urgency_bias"]

        search_query = " ".join(weaknesses)
        
        # 1. Try pgvector similarity search in Supabase if online
        if self.supabase:
            query_embedding = self._get_embedding(search_query)
            if query_embedding:
                try:
                    res = self.supabase.rpc(
                        'match_training',
                        {
                            'query_embedding': query_embedding,
                            'match_threshold': 0.65,
                            'match_count': top_k
                        }
                    ).execute()
                    if res.data:
                        return res.data
                except Exception:
                    pass

            # Fallback: Query cyber_training table via SQL ILIKE
            try:
                matched_rows = []
                for w in weaknesses:
                    clean_w = w.replace("_", " ").lower()
                    resp = self.supabase.table("cyber_training").select("*").ilike("category", f"%{w}%").limit(top_k).execute()
                    if resp.data:
                        matched_rows.extend(resp.data)
                if matched_rows:
                    return matched_rows[:top_k]
            except Exception:
                pass

        # 2. Resilient local fallback from curated NIST knowledge store
        results = []
        for mod in DEFAULT_CYBER_TRAINING_MODULES:
            cat = mod["category"]
            for w in weaknesses:
                w_clean = w.lower().replace(" ", "_")
                if w_clean in cat or cat in w_clean or any(k in mod["content"].lower() for k in w_clean.split("_")):
                    if mod not in results:
                        results.append(mod)
                        break
                        
        if not results:
            results = DEFAULT_CYBER_TRAINING_MODULES[:top_k]

        return results[:top_k]
