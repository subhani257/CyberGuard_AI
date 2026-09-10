import spacy
from typing import Dict, Any

class ReasoningClassifier:
    """Classifies user reasoning to understand their thought process and security awareness."""
    
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            self.nlp = spacy.blank("en")
            
        if "parser" not in self.nlp.pipe_names and "sentencizer" not in self.nlp.pipe_names:
            self.nlp.add_pipe("sentencizer")
        
        # Keywords for different reasoning categories
        self.security_aware_keywords = [
            "verify", "check", "confirm", "validate", "authenticate",
            "suspicious", "phishing", "scam", "fake", "legitimate",
            "official", "alternate channel", "phone call", "in person",
            "security", "safe", "caution", "careful", "reported"
        ]
        
        self.trust_based_keywords = [
            "authority", "ceo", "manager", "boss", "supervisor",
            "urgent", "immediately", "asap", "emergency", "deadline",
            "trust", "believe", "they said", "he said", "she said",
            "official email", "from", "sender", "request"
        ]
        
        self.naive_keywords = [
            "clicked", "opened", "replied", "responded",
            "didn't know", "not sure", "maybe", "thought",
            "seemed real", "looked official", "just in case",
            "wanted to help", "didn't want to miss", "followed instructions"
        ]
    
    def classify(self, user_reasoning: str) -> Dict[str, Any]:
        """
        Classify the user's reasoning into security-aware, trust-based, or naive.
        
        Args:
            user_reasoning: The user's written explanation for their decision
            
        Returns:
            Dictionary with classification category, confidence, and analysis
        """
        doc = self.nlp(user_reasoning.lower())
        
        # Score each category
        security_score = self._calculate_category_score(doc, self.security_aware_keywords)
        trust_score = self._calculate_category_score(doc, self.trust_based_keywords)
        naive_score = self._calculate_category_score(doc, self.naive_keywords)
        
        # Determine dominant category
        scores = {
            "security_aware": security_score,
            "trust_based": trust_score,
            "naive": naive_score
        }
        
        dominant_category = max(scores, key=scores.get)
        confidence = scores[dominant_category]
        
        # Additional analysis
        analysis = self._analyze_reasoning(doc, dominant_category)
        
        return {
            "category": dominant_category,
            "confidence": confidence,
            "scores": scores,
            "analysis": analysis,
            "security_indicators": self._extract_security_indicators(doc),
            "risk_indicators": self._extract_risk_indicators(doc)
        }
    
    def _calculate_category_score(self, doc, keywords: list) -> float:
        """Calculate score for a category based on keyword matches."""
        text = doc.text
        matches = 0
        matched_keywords = []
        
        for keyword in keywords:
            if keyword in text:
                matches += 1
                matched_keywords.append(keyword)
        
        # Normalize score based on number of keywords
        if not keywords:
            return 0.0
        
        base_score = matches / len(keywords)
        
        # Boost score if multiple matches
        if matches >= 2:
            base_score = min(base_score * 1.5, 1.0)
        
        return base_score
    
    def _analyze_reasoning(self, doc, category: str) -> str:
        """Generate analysis text based on category."""
        if category == "security_aware":
            return "User demonstrates security awareness by mentioning verification, checking sources, or identifying suspicious elements."
        elif category == "trust_based":
            return "User's reasoning relies on authority, urgency, or trust in the sender rather than security verification."
        elif category == "naive":
            return "User shows limited security consideration, focusing on compliance or uncertainty rather than verification."
        else:
            return "Unable to clearly classify reasoning pattern."
    
    def _extract_security_indicators(self, doc) -> list:
        """Extract specific security-positive indicators from reasoning."""
        indicators = []
        
        for token in doc:
            if token.text in self.security_aware_keywords:
                indicators.append({
                    "indicator": token.text,
                    "context": token.sent.text.strip()
                })
        
        return indicators
    
    def _extract_risk_indicators(self, doc) -> list:
        """Extract specific risk indicators from reasoning."""
        indicators = []
        
        for token in doc:
            if token.text in self.trust_based_keywords or token.text in self.naive_keywords:
                indicators.append({
                    "indicator": token.text,
                    "context": token.sent.text.strip(),
                    "type": "trust" if token.text in self.trust_based_keywords else "naive"
                })
        
        return indicators


# Example usage and testing
if __name__ == "__main__":
    classifier = ReasoningClassifier()
    
    # Test with different reasoning examples
    test_cases = [
        "I verified the sender's identity by calling the official company phone number before responding.",
        "The email came from the CEO, so I immediately processed the request as instructed.",
        "I wasn't sure, but it looked official so I clicked the link to be safe.",
        "I noticed the domain looked suspicious, so I reported it to IT and didn't respond.",
        "They said it was urgent, so I replied right away to help."
    ]
    
    print("Reasoning Classification Results:")
    print("=" * 60)
    
    for i, reasoning in enumerate(test_cases, 1):
        result = classifier.classify(reasoning)
        print(f"\nTest Case {i}:")
        print(f"Reasoning: {reasoning}")
        print(f"Category: {result['category']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Analysis: {result['analysis']}")
        print(f"Security Indicators: {result['security_indicators']}")
        print(f"Risk Indicators: {result['risk_indicators']}")
