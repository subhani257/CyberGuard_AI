import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Ground-truth NIST SP 800-50, SANS & CISA multi-channel training guidance repository
DEFAULT_CYBER_TRAINING_MODULES = [
    {
        "category": "urgency_bias",
        "channel": "email",
        "target_risk_surface": "general",
        "source": "NIST SP 800-50 Sec 3.2",
        "content": (
            "Social engineers leverage psychological time pressure ('Urgent Action Required', '24-hour account suspension') "
            "to inhibit rational scrutiny. Training Directive: Implement an institutional 'Stop & Verify' rule. All requests "
            "demanding immediate fund transfers or password resets must undergo out-of-band telephone or verbal verification."
        ),
        "metadata": {"framework": "NIST", "topic": "Urgency & Psychological Coercion", "level": "foundational"}
    },
    {
        "category": "vishing_defense",
        "channel": "voice_phone",
        "target_risk_surface": "financial_and_executive",
        "source": "CISA Alert AA22-216A / NIST SP 800-50",
        "content": (
            "Voice Phishing (Vishing) & Deepfake Audio Directive: Audio familiarity can be spoofed using AI generative voice cloning. "
            "Any phone call demanding emergency wire transfers, gift cards, or MFA passcodes requires immediately hanging up and "
            "initiating a callback to the verified internal directory extension."
        ),
        "metadata": {"framework": "CISA", "topic": "Voice Phishing & AI Audio Cloning Defense", "level": "advanced"}
    },
    {
        "category": "chat_compromise_defense",
        "channel": "slack_teams",
        "target_risk_surface": "collaboration_and_dev",
        "source": "SANS OUCH! Messaging Security",
        "content": (
            "Chat & Instant Messaging Directive: Attackers holding stolen session tokens send malicious scripts or requests "
            "over Slack/Teams direct messages. Never execute scripts, disable endpoint protection, or share tokens over chat without "
            "an authenticated ticketing system reference."
        ),
        "metadata": {"framework": "SANS", "topic": "Slack/Teams Session Compromise Defense", "level": "intermediate"}
    },
    {
        "category": "quishing_detection",
        "channel": "qr_code",
        "target_risk_surface": "mobile_and_physical",
        "source": "NCSC Quishing Advisory",
        "content": (
            "QR Code (Quishing) Defense Directive: QR codes obscure malicious URLs from standard email sandboxes. Never scan QR codes "
            "from physical posters, cafeteria notices, or email PDFs that prompt for corporate SSO login, 2FA reconfiguration, or banking credentials."
        ),
        "metadata": {"framework": "NCSC", "topic": "Quishing & QR Code Phishing Defense", "level": "foundational"}
    },
    {
        "category": "oauth_consent_defense",
        "channel": "cloud_oauth",
        "target_risk_surface": "cloud_and_saas",
        "source": "CISA Cloud Security / Microsoft 365 Defense",
        "content": (
            "Illicit OAuth Consent Grant Directive: Malicious SaaS integrations request excessive permissions (e.g., 'Read and Write Mail') "
            "bypassing credential authentication. Only grant third-party OAuth app permissions approved by the official enterprise IT security catalog."
        ),
        "metadata": {"framework": "CISA", "topic": "Cloud OAuth & Third-Party App Hijack Defense", "level": "intermediate"}
    },
    {
        "category": "mfa_fatigue_defense",
        "channel": "sms_push",
        "target_risk_surface": "privileged_access",
        "source": "NIST SP 800-63B",
        "content": (
            "MFA Bombing / Push Fatigue Directive: Repeated unsolicited push notifications indicate compromised credentials. Never tap "
            "'Approve' to silence alerts. Immediately tap 'Deny' and report active credential exploitation to the Security Operations Center (SOC)."
        ),
        "metadata": {"framework": "NIST", "topic": "MFA Push Fatigue & Credential Breach Response", "level": "intermediate"}
    },
    {
        "category": "authority_abuse",
        "channel": "email",
        "target_risk_surface": "finance_and_operations",
        "source": "SANS Securing The Human - Executive Impersonation",
        "content": (
            "Business Email Compromise (BEC) attackers frequently spoof C-suite executives (CEO, CFO) to exploit compliance reflexes. "
            "Training Directive: Institutional protocol strictly supersedes individual hierarchy. No employee may bypass mandatory "
            "multi-signature authorization regardless of the stated sender title or urgency."
        ),
        "metadata": {"framework": "SANS", "topic": "Authority Cues & BEC Defense", "level": "intermediate"}
    },
    {
        "category": "financial_requests",
        "channel": "email",
        "target_risk_surface": "financial_access",
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
        "channel": "email",
        "target_risk_surface": "identity_and_sso",
        "source": "NIST SP 800-63B",
        "content": (
            "Credential harvesting pages replicate corporate single sign-on (SSO) portals. "
            "Training Directive: Utilize FIDO2/WebAuthn hardware tokens and password managers that cryptographically bind credentials "
            "to verified top-level domains. Never submit enterprise credentials via unsolicited links."
        ),
        "metadata": {"framework": "NIST", "topic": "Authentication Security & Credential Hygiene", "level": "foundational"}
    },
    {
        "category": "removable_media_defense",
        "channel": "physical_media",
        "target_risk_surface": "physical_security",
        "source": "CISA / SANS Removable Media Security",
        "content": (
            "USB Baiting & Physical Drop Directive: Unsolicited USB flash drives or storage devices found in parking lots, lobbies, or sent via postal mail "
            "often contain weaponized HID keystroke injection payloads. Never insert untrusted physical media into corporate endpoints. Hand immediately to physical security."
        ),
        "metadata": {"framework": "CISA", "topic": "USB Baiting & Physical Media Defense", "level": "foundational"}
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

    def retrieve_guidance(self, weaknesses: List[Any], top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieve relevant NIST / SANS training material matching detected weaknesses or channels.
        Handles both strings and list arguments robustly.
        """
        flat_weaknesses: List[str] = []
        if not weaknesses:
            flat_weaknesses = ["urgency_bias"]
        else:
            for item in weaknesses:
                if isinstance(item, list):
                    flat_weaknesses.extend([str(x) for x in item if x])
                elif item:
                    flat_weaknesses.append(str(item))
        
        if not flat_weaknesses:
            flat_weaknesses = ["urgency_bias"]

        search_query = " ".join(flat_weaknesses)
        
        # 1. Match against curated high-fidelity NIST/SANS knowledge store using scored IR ranking
        STOP_WORDS = {"defense", "detection", "protection", "training", "bias", "indicator", "general", "cyber"}
        scored_modules = []
        
        for mod in DEFAULT_CYBER_TRAINING_MODULES:
            cat = mod.get("category", "").lower()
            channel = mod.get("channel", "").lower()
            risk_surface = mod.get("target_risk_surface", "").lower()
            content_lower = mod.get("content", "").lower()
            topic_lower = mod.get("metadata", {}).get("topic", "").lower()
            
            score = 0
            for w in flat_weaknesses:
                w_clean = w.lower().replace(" ", "_")
                tokens = [t for t in w.lower().replace("_", " ").split() if len(t) > 2]
                
                # Exact category or channel match gets highest priority
                if w_clean == cat or w_clean == channel:
                    score += 100
                elif w_clean in cat or cat in w_clean or w_clean in channel or channel in w_clean:
                    score += 50
                elif w_clean in risk_surface:
                    score += 30
                
                # Token-level scoring (deprioritize common suffixes)
                for t in tokens:
                    if t not in STOP_WORDS:
                        if t in cat or t in channel:
                            score += 20
                        elif t in topic_lower:
                            score += 10
                        elif t in content_lower:
                            score += 5
                    else:
                        if t in cat or t in channel:
                            score += 1

            if score > 0:
                scored_modules.append((score, mod))

        if scored_modules:
            # Sort descending by IR score
            scored_modules.sort(key=lambda x: x[0], reverse=True)
            return [m[1] for m in scored_modules[:top_k]]

        # 2. Try pgvector similarity search in Supabase if online
        if self.supabase:
            query_embedding = self._get_embedding(search_query)
            if query_embedding:
                try:
                    res = self.supabase.rpc(
                        'match_training',
                        {
                            'query_embedding': query_embedding,
                            'match_threshold': 0.75,
                            'match_count': top_k
                        }
                    ).execute()
                    if res.data and len(res.data) > 0:
                        return res.data[:top_k]
                except Exception:
                    pass

        return DEFAULT_CYBER_TRAINING_MODULES[:top_k]
