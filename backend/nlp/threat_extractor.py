import spacy
import re
from typing import Dict, List, Any

class ThreatExtractor:
    """Extracts threat indicators from all communication scenarios:
    Email/BEC, Voice/Vishing, Direct Message Pretexting,
    Quishing/Supply Chain, Cloud App Consent Abuse, MFA Fatigue."""
    
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            self.nlp = spacy.blank("en")
            
        if "parser" not in self.nlp.pipe_names and "sentencizer" not in self.nlp.pipe_names:
            self.nlp.add_pipe("sentencizer")
        
        # Keywords for different threat types
        self.financial_keywords = [
            "wire transfer", "invoice", "payment", "bank account", 
            "deposit", "transaction", "purchase order", "remittance",
            "settlement", "funds", "money", "credit", "debit"
        ]
        
        self.urgency_keywords = [
            "immediately", "urgent", "asap", "right away", "now",
            "emergency", "critical", "deadline", "time sensitive",
            "hurry", "quickly", "without delay", "instant"
        ]
        
        self.authority_keywords = [
            "ceo", "chief executive", "president", "director",
            "manager", "supervisor", "hr", "finance", "accounting",
            "it department", "legal", "executive"
        ]

        # --- NEW: Quishing & QR Code Attack keywords ---
        self.qr_code_keywords = [
            "qr code", "scan the code", "scan this", "scan to verify",
            "scan to login", "scan to access", "camera", "qr",
            "scan the qr", "use your phone to scan", "scan for details"
        ]

        # --- NEW: Supply Chain Pretext keywords ---
        self.supply_chain_keywords = [
            "vendor", "supplier", "third-party", "third party", "contractor",
            "partner", "outsourced", "service provider", "new bank details",
            "updated payment details", "account change", "new account number",
            "remittance advice", "procurement", "purchase order updated"
        ]

        # --- NEW: Cloud App Consent Abuse keywords ---
        self.cloud_app_keywords = [
            "grant access", "authorize", "oauth", "permissions", "consent",
            "sign in with google", "sign in with microsoft", "connect your account",
            "allow access", "approve access", "app permissions", "third-party app",
            "cloud app", "integration", "api access", "read your email",
            "access your files", "sharepoint", "onedrive", "google drive"
        ]

        # --- NEW: MFA Fatigue & Push Bombing keywords ---
        self.mfa_fatigue_keywords = [
            "approve the push", "mfa request", "authentication request",
            "push notification", "approve this login", "deny if not you",
            "verification code", "one-time code", "authenticator app",
            "confirm your identity", "approve on your phone", "mfa prompt",
            "push bombing", "multiple requests", "repeated prompts"
        ]

        # --- NEW: Voice / Vishing & Direct Message Pretexting keywords ---
        self.vishing_dm_keywords = [
            "phone call", "called me", "over the phone", "voice message",
            "voicemail", "called from", "helpdesk called", "it support called",
            "direct message", "dm", "slack message", "teams message",
            "whatsapp", "text message", "sms", "messaged me",
            "remote access", "remote desktop", "anydesk", "teamviewer",
            "screen sharing", "allow remote", "install this tool"
        ]
    
    def extract(self, scenario_text: str) -> Dict[str, Any]:
        """
        Extract all threat indicators from scenario text using NLP linguistic
        context and pattern detection.
        
        Args:
            scenario_text: The scenario text to analyze
            
        Returns:
            Dictionary with detected threat indicators and confidence scores
        """
        doc = self.nlp(scenario_text)
        spoofed = self._detect_spoofed_identifiers(scenario_text)
        
        indicators = {
            # Domain and identity spoofing (supporting both keys for full compatibility)
            "spoofed_identifiers": spoofed,
            "spoofed_domains": spoofed,
            "financial_requests": self._detect_financial_requests(doc),
            "urgency_indicators": self._detect_urgency(doc),
            "authority_abuse": self._detect_authority_abuse(doc),
            "suspicious_urls": self._detect_suspicious_urls(scenario_text),
            "attachment_requests": self._detect_attachment_requests(doc),
            # Multi-channel training area indicators
            "qr_code_attacks": self._detect_by_keywords(doc, self.qr_code_keywords, 0.8),
            "supply_chain_pretext": self._detect_by_keywords(doc, self.supply_chain_keywords, 0.75),
            "cloud_app_consent": self._detect_by_keywords(doc, self.cloud_app_keywords, 0.8),
            "mfa_fatigue": self._detect_by_keywords(doc, self.mfa_fatigue_keywords, 0.85),
            "vishing_dm_pretext": self._detect_by_keywords(doc, self.vishing_dm_keywords, 0.75)
        }
        
        # Calculate overall threat confidence
        confidence = self._calculate_confidence(indicators)
        
        return {
            "indicators": indicators,
            "confidence": confidence,
            "threat_types": self._classify_threat_type(indicators)
        }

    def _is_negated_or_inactive(self, sent, keyword: str) -> bool:
        """
        Use spaCy dependency parsing and contextual cues to check if a keyword
        is negated or refers to an already completed/archived non-threat event.
        """
        text_lower = sent.text.lower()
        
        # Context cues indicating completed, audited, or inactive routine processes
        inactive_cues = [
            "needs no action", "no action required", "was reconciled",
            "already archived", "normal procurement", "completed payment was",
            "already processed", "without checking", "do not", "don't", "never",
            "should not", "shouldn't"
        ]
        if any(cue in text_lower for cue in inactive_cues):
            return True

        # Linguistic dependency check using spaCy tokens
        for token in sent:
            if token.dep_ == "neg":
                return True
        return False
    
    def _detect_spoofed_identifiers(self, text: str) -> List[Dict[str, Any]]:
        """Detect potentially spoofed identifiers (domains, usernames)."""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text, re.IGNORECASE)
        
        spoofed = []
        for email in emails:
            domain = email.split('@')[1]
            if self._is_suspicious_domain(domain):
                spoofed.append({
                    "email": email,
                    "domain": domain,
                    "reason": self._get_spoof_reason(domain),
                    "confidence": 0.8
                })
        
        return spoofed
    
    def _is_suspicious_domain(self, domain: str) -> bool:
        """Check if domain shows spoofing patterns using heuristic and lookalike analysis."""
        domain_lower = domain.lower().strip()
        domain_name = domain_lower.split('.')[0]

        # 1. Number substitutions / leetspeak (e.g., micros0ft-login.com, novat3ch.com)
        if re.search(r'\d', domain_name):
            return True

        # 2. Known brand / enterprise impersonation with hyphens or security keywords
        target_brands = ['microsoft', 'google', 'amazon', 'apple', 'facebook', 'novatech', 'paypal', 'cisco', 'outlook']
        brand_modifiers = ['security', 'login', 'corp', 'support', 'update', 'verify', 'portal', 'alert', 'auth', 'invoices', 'account']

        for brand in target_brands:
            if brand in domain_name:
                # If not the exact authentic domain
                if domain_lower not in [f"{brand}.com", f"{brand}.org"]:
                    return True
                
        # 3. Check for hyphenated modifier patterns often used in phishing lures (e.g. login-verify.xyz)
        if '-' in domain_name and any(mod in domain_name for mod in brand_modifiers):
            return True

        # 4. Deceptive TLDs for corporate lookalikes
        high_risk_tlds = ['.xyz', '.top', '.work', '.click', '.loan', '.gq', '.cf', '.tk', '.ml']
        if any(domain_lower.endswith(tld) for tld in high_risk_tlds):
            return True

        return False
    
    def _get_spoof_reason(self, domain: str) -> str:
        """Get reason why domain is suspicious."""
        domain_lower = domain.lower()
        if re.search(r'\d', domain_lower.split('.')[0]):
            return "Contains numbers (possible character substitution / leetspeak)"
        if '-' in domain_lower:
            return "Contains deceptive hyphenated brand or security keyword"
        return "Similar to known corporate domain but uses lookalike structure"
    
    def _detect_financial_requests(self, doc) -> List[Dict[str, Any]]:
        """Detect financial transaction requests with negation & completion filtering."""
        financial = []
        for sent in doc.sents:
            sent_text_lower = sent.text.lower()
            for keyword in self.financial_keywords:
                if keyword in sent_text_lower:
                    if self._is_negated_or_inactive(sent, keyword):
                        continue
                    financial.append({
                        "keyword": keyword,
                        "context": sent.text.strip(),
                        "confidence": 0.7
                    })
                    break
        return financial
    
    def _detect_urgency(self, doc) -> List[Dict[str, Any]]:
        """Detect urgency indicators with negation & completion filtering."""
        urgency = []
        for sent in doc.sents:
            sent_text_lower = sent.text.lower()
            for keyword in self.urgency_keywords:
                if keyword in sent_text_lower:
                    if self._is_negated_or_inactive(sent, keyword):
                        continue
                    urgency.append({
                        "keyword": keyword,
                        "context": sent.text.strip(),
                        "confidence": 0.75
                    })
                    break
        return urgency
    
    def _detect_authority_abuse(self, doc) -> List[Dict[str, Any]]:
        """Detect attempts to use authority with word boundary and negation checks."""
        authority = []
        for sent in doc.sents:
            sent_text_lower = sent.text.lower()
            for keyword in self.authority_keywords:
                if re.search(r'\b' + re.escape(keyword) + r'\b', sent_text_lower):
                    if self._is_negated_or_inactive(sent, keyword):
                        continue
                    authority.append({
                        "keyword": keyword,
                        "context": sent.text.strip(),
                        "confidence": 0.65
                    })
                    break
        return authority
    
    def _detect_suspicious_urls(self, text: str) -> List[Dict[str, Any]]:
        """Detect suspicious URLs."""
        url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+'
        urls = re.findall(url_pattern, text, re.IGNORECASE)
        
        suspicious = []
        for url in urls:
            # Check for URL shorteners or suspicious patterns
            if self._is_suspicious_url(url):
                suspicious.append({
                    "url": url,
                    "reason": "Suspicious URL pattern",
                    "confidence": 0.7
                })
        
        return suspicious
    
    def _is_suspicious_url(self, url: str) -> bool:
        """Check if URL shows suspicious patterns."""
        shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co']
        for shortener in shorteners:
            if shortener in url.lower():
                return True
        # Check for IP addresses in URL
        if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url):
            return True
        return False
    
    def _detect_attachment_requests(self, doc) -> List[Dict[str, Any]]:
        """Detect requests to open attachments."""
        attachment_keywords = [
            "attachment", "file", "document", "open", "download",
            "invoice attached", "see attached", "attached file"
        ]
        return self._detect_by_keywords(doc, attachment_keywords, 0.6)

    def _detect_by_keywords(
        self, doc, keywords: List[str], confidence: float
    ) -> List[Dict[str, Any]]:
        """Generic keyword-based detector with negation filtering."""
        found = []
        for sent in doc.sents:
            sent_text_lower = sent.text.lower()
            for keyword in keywords:
                if keyword in sent_text_lower:
                    if self._is_negated_or_inactive(sent, keyword):
                        continue
                    found.append({
                        "keyword": keyword,
                        "context": sent.text.strip(),
                        "confidence": confidence
                    })
                    break
        return found
    
    def _calculate_confidence(self, indicators: Dict[str, List]) -> float:
        """Calculate overall threat confidence based on number of indicators."""
        total_indicators = sum(len(v) for v in indicators.values())
        
        if total_indicators == 0:
            return 0.0
        elif total_indicators <= 2:
            return 0.5
        elif total_indicators <= 4:
            return 0.7
        else:
            return 0.9
    
    def _classify_threat_type(self, indicators: Dict[str, List]) -> List[str]:
        """Classify the likely threat type based on indicators across all training areas."""
        threat_types = []

        # --- Area 1: Email & BEC Defence ---
        if indicators["financial_requests"] and indicators["urgency_indicators"]:
            threat_types.append("Business Email Compromise (BEC)")

        # --- Area 2: Sender / Domain Spoofing ---
        if indicators["spoofed_identifiers"]:
            threat_types.append("Sender / Domain Spoofing")

        # --- Area 3: Phishing Link ---
        if indicators["suspicious_urls"]:
            threat_types.append("Phishing Link")

        # --- Area 4: Malicious Attachment ---
        if indicators["attachment_requests"]:
            threat_types.append("Malicious Attachment")

        # --- Area 5: Quishing & QR Code Attack ---
        if indicators["qr_code_attacks"]:
            threat_types.append("Quishing / QR Code Phishing")

        # --- Area 6: Supply Chain Pretext ---
        if indicators["supply_chain_pretext"]:
            threat_types.append("Supply Chain Pretext / Vendor Fraud")

        # --- Area 7: Cloud App Consent Abuse ---
        if indicators["cloud_app_consent"]:
            threat_types.append("Cloud App Consent Abuse / OAuth Phishing")

        # --- Area 8: MFA Fatigue & Push Bombing ---
        if indicators["mfa_fatigue"]:
            threat_types.append("MFA Fatigue / Push Bombing")

        # --- Area 9: Voice Vishing & Direct Message Pretexting ---
        if indicators["vishing_dm_pretext"]:
            threat_types.append("Voice Vishing / Direct Message Pretexting")

        if not threat_types:
            threat_types.append("Suspicious Communication")

        return threat_types


# Example usage and testing
if __name__ == "__main__":
    extractor = ThreatExtractor()
    
    # Test with ALL training area scenarios
    test_scenarios = [
        # Area 1: Email & BEC
        "URGENT: Wire $50,000 immediately. CEO request. Do not discuss with anyone.",
        # Area 2: Quishing
        "Please scan the QR code on your phone to verify your account access.",
        # Area 3: Supply Chain
        "Our vendor updated their bank account details. Please use the new account number for all future payments.",
        # Area 4: Cloud App Consent
        "Please authorize this third-party app to access your Google Drive and read your emails.",
        # Area 5: MFA Fatigue
        "You will receive multiple MFA push notifications. Please approve the push on your phone to continue.",
        # Area 6: Vishing / DM
        "IT Support called me and asked me to install AnyDesk and allow remote access to fix an issue."
    ]

    for i, test_scenario in enumerate(test_scenarios, 1):
        result = extractor.extract(test_scenario)
        print(f"\n{'='*60}")
        print(f"Test Scenario {i}: {test_scenario[:60]}...")
        print(f"Threat Types Detected: {result['threat_types']}")
        print(f"Overall Confidence: {result['confidence']}")
    
    result = extractor.extract(test_scenario)
    print("Threat Analysis Result:")
    print(f"Overall Confidence: {result['confidence']}")
    print(f"Threat Types: {result['threat_types']}")
    print("\nIndicators:")
    for key, value in result['indicators'].items():
        if value:
            print(f"  {key}: {value}")
