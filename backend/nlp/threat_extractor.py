import spacy
import re
from typing import Dict, List, Any

class ThreatExtractor:
    """Extracts threat indicators from email scenarios using NLP and rule-based patterns."""
    
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        
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
    
    def extract(self, scenario_text: str) -> Dict[str, Any]:
        """
        Extract all threat indicators from scenario text.
        
        Args:
            scenario_text: The email scenario text to analyze
            
        Returns:
            Dictionary with detected threat indicators and confidence scores
        """
        doc = self.nlp(scenario_text)
        
        indicators = {
            "spoofed_domains": self._detect_spoofed_domains(scenario_text),
            "financial_requests": self._detect_financial_requests(doc),
            "urgency_indicators": self._detect_urgency(doc),
            "authority_abuse": self._detect_authority_abuse(doc),
            "suspicious_urls": self._detect_suspicious_urls(scenario_text),
            "attachment_requests": self._detect_attachment_requests(doc)
        }
        
        # Calculate overall threat confidence
        confidence = self._calculate_confidence(indicators)
        
        return {
            "indicators": indicators,
            "confidence": confidence,
            "threat_types": self._classify_threat_type(indicators)
        }
    
    def _detect_spoofed_domains(self, text: str) -> List[Dict[str, Any]]:
        """Detect potentially spoofed email domains."""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text, re.IGNORECASE)
        
        spoofed = []
        for email in emails:
            domain = email.split('@')[1]
            # Check for common spoofing patterns
            if self._is_suspicious_domain(domain):
                spoofed.append({
                    "email": email,
                    "domain": domain,
                    "reason": self._get_spoof_reason(domain),
                    "confidence": 0.8
                })
        
        return spoofed
    
    def _is_suspicious_domain(self, domain: str) -> bool:
        """Check if domain shows spoofing patterns."""
        # Check for number substitutions (e.g., micros0ft.com)
        if re.search(r'\d', domain):
            return True
        # Check for slight misspellings of common domains
        common_domains = ['microsoft', 'google', 'amazon', 'apple', 'facebook']
        for common in common_domains:
            if common in domain.lower() and domain.lower() != f"{common}.com":
                return True
        return False
    
    def _get_spoof_reason(self, domain: str) -> str:
        """Get reason why domain is suspicious."""
        if re.search(r'\d', domain):
            return "Contains numbers (possible substitution)"
        return "Similar to known domain but different spelling"
    
    def _detect_financial_requests(self, doc) -> List[Dict[str, Any]]:
        """Detect financial transaction requests."""
        financial = []
        text_lower = doc.text.lower()
        
        for keyword in self.financial_keywords:
            if keyword in text_lower:
                # Find the sentence containing the keyword
                for sent in doc.sents:
                    if keyword in sent.text.lower():
                        financial.append({
                            "keyword": keyword,
                            "context": sent.text.strip(),
                            "confidence": 0.7
                        })
                        break
        
        return financial
    
    def _detect_urgency(self, doc) -> List[Dict[str, Any]]:
        """Detect urgency indicators."""
        urgency = []
        text_lower = doc.text.lower()
        
        for keyword in self.urgency_keywords:
            if keyword in text_lower:
                for sent in doc.sents:
                    if keyword in sent.text.lower():
                        urgency.append({
                            "keyword": keyword,
                            "context": sent.text.strip(),
                            "confidence": 0.75
                        })
                        break
        
        return urgency
    
    def _detect_authority_abuse(self, doc) -> List[Dict[str, Any]]:
        """Detect attempts to use authority to pressure the victim."""
        authority = []
        text_lower = doc.text.lower()
        
        for keyword in self.authority_keywords:
            if keyword in text_lower:
                for sent in doc.sents:
                    if keyword in sent.text.lower():
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
        
        attachments = []
        text_lower = doc.text.lower()
        
        for keyword in attachment_keywords:
            if keyword in text_lower:
                for sent in doc.sents:
                    if keyword in sent.text.lower():
                        attachments.append({
                            "keyword": keyword,
                            "context": sent.text.strip(),
                            "confidence": 0.6
                        })
                        break
        
        return attachments
    
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
        """Classify the likely threat type based on indicators."""
        threat_types = []
        
        if indicators["financial_requests"] and indicators["urgency_indicators"]:
            threat_types.append("Business Email Compromise (BEC)")
        
        if indicators["spoofed_domains"]:
            threat_types.append("Domain Spoofing")
        
        if indicators["suspicious_urls"]:
            threat_types.append("Phishing Link")
        
        if indicators["attachment_requests"]:
            threat_types.append("Malicious Attachment")
        
        if not threat_types:
            threat_types.append("Suspicious Email")
        
        return threat_types


# Example usage and testing
if __name__ == "__main__":
    extractor = ThreatExtractor()
    
    # Test with a sample scenario
    test_scenario = """
    From: ceo@novatech-global.com
    Subject: Urgent Wire Transfer
    
    I need you to process this wire transfer immediately for the new acquisition. 
    Do not tell anyone else yet. The amount is $50,000 and must be sent today.
    Please see the attached invoice for details.
    """
    
    result = extractor.extract(test_scenario)
    print("Threat Analysis Result:")
    print(f"Overall Confidence: {result['confidence']}")
    print(f"Threat Types: {result['threat_types']}")
    print("\nIndicators:")
    for key, value in result['indicators'].items():
        if value:
            print(f"  {key}: {value}")
