from typing import Dict, Any, List

class SecurityAnalyzer:
    """Analyzes threat indicators and determines expected safe behavior."""
    
    def __init__(self):
        # Mapping of threat indicators to safe behaviors
        self.behavior_rules = {
            "spoofed_domains": {
                "safe_action": "Verify sender identity through alternate channel",
                "safe_reasoning": "The email domain appears suspicious. Verify the sender's identity using a different communication method (phone call to known number, in-person, or official company portal) before taking any action.",
                "risk_level": "high"
            },
            "financial_requests": {
                "safe_action": "Confirm with finance department through official channels",
                "safe_reasoning": "Financial requests via email are high-risk. Confirm the request with your finance department using official channels (phone call to known number, in-person verification, or official finance portal) before processing any payments.",
                "risk_level": "high"
            },
            "urgency_indicators": {
                "safe_action": "Slow down and verify legitimacy",
                "safe_reasoning": "Urgency is a common tactic to bypass logical thinking. Take time to verify the request's legitimacy through alternate channels before responding or taking action.",
                "risk_level": "medium"
            },
            "authority_abuse": {
                "safe_action": "Verify authority through official channels",
                "safe_reasoning": "Attackers often impersonate authority figures. Verify the request with the supposed authority figure through a known, trusted communication method before complying.",
                "risk_level": "high"
            },
            "suspicious_urls": {
                "safe_action": "Do not click links; verify through official channels",
                "safe_reasoning": "Suspicious URLs may lead to phishing sites or malware. Do not click any links. Instead, navigate to the official website directly or verify the request through official channels.",
                "risk_level": "high"
            },
            "attachment_requests": {
                "safe_action": "Do not open attachments; verify sender first",
                "safe_reasoning": "Email attachments can contain malware. Do not open any attachments unless you have verified the sender's identity and the attachment's legitimacy through alternate channels.",
                "risk_level": "high"
            }
        }
    
    def determine_safe_behavior(self, threat_indicators: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determine the expected safe behavior based on detected threat indicators.
        
        Args:
            threat_indicators: Dictionary of threat indicators from ThreatExtractor
            
        Returns:
            Dictionary with expected safe action, reasoning, and risk assessment
        """
        detected_threats = []
        risk_levels = []
        
        # Check which threat indicators are present
        for threat_type, indicators in threat_indicators.items():
            if indicators and len(indicators) > 0:
                detected_threats.append(threat_type)
                if threat_type in self.behavior_rules:
                    risk_levels.append(self.behavior_rules[threat_type]["risk_level"])
        
        # Determine overall risk level
        overall_risk = self._calculate_overall_risk(risk_levels)
        
        # Generate safe behavior recommendation
        safe_behavior = self._generate_safe_behavior(detected_threats, overall_risk)
        
        return {
            "detected_threats": detected_threats,
            "overall_risk": overall_risk,
            "expected_safe_action": safe_behavior["action"],
            "expected_safe_reasoning": safe_behavior["reasoning"],
            "recommended_actions": self._get_recommended_actions(detected_threats)
        }
    
    def _calculate_overall_risk(self, risk_levels: List[str]) -> str:
        """Calculate overall risk level based on individual risks."""
        if not risk_levels:
            return "low"
        
        if "high" in risk_levels:
            return "high"
        elif "medium" in risk_levels:
            return "medium"
        else:
            return "low"
    
    def _generate_safe_behavior(self, detected_threats: List[str], overall_risk: str) -> Dict[str, str]:
        """Generate safe action and reasoning based on detected threats."""
        if not detected_threats:
            return {
                "action": "Proceed with normal caution",
                "reasoning": "No significant threat indicators detected. However, always exercise caution with unexpected requests."
            }
        
        # Combine behaviors for multiple threats
        actions = []
        reasoning_parts = []
        
        for threat in detected_threats:
            if threat in self.behavior_rules:
                actions.append(self.behavior_rules[threat]["safe_action"])
                reasoning_parts.append(self.behavior_rules[threat]["safe_reasoning"])
        
        # Combine multiple actions/reasonings
        combined_action = " AND ".join(actions) if len(actions) > 1 else actions[0]
        combined_reasoning = " ".join(reasoning_parts) if reasoning_parts else "Exercise caution."
        
        return {
            "action": combined_action,
            "reasoning": combined_reasoning
        }
    
    def _get_recommended_actions(self, detected_threats: List[str]) -> List[str]:
        """Get list of specific recommended actions based on threats."""
        recommendations = []
        
        if "spoofed_domains" in detected_threats:
            recommendations.append("Verify sender email domain")
            recommendations.append("Contact sender through known alternate channel")
        
        if "financial_requests" in detected_threats:
            recommendations.append("Confirm with finance department")
            recommendations.append("Verify payment details through official channels")
            recommendations.append("Do not process without dual verification")
        
        if "urgency_indicators" in detected_threats:
            recommendations.append("Ignore urgency pressure")
            recommendations.append("Take time to verify request")
            recommendations.append("Consult with supervisor if unsure")
        
        if "authority_abuse" in detected_threats:
            recommendations.append("Verify authority figure's identity")
            recommendations.append("Confirm request through official company channels")
        
        if "suspicious_urls" in detected_threats:
            recommendations.append("Do not click any links")
            recommendations.append("Navigate to official website directly")
            recommendations.append("Report suspicious URLs to IT")
        
        if "attachment_requests" in detected_threats:
            recommendations.append("Do not open attachments")
            recommendations.append("Scan attachments with antivirus if verified")
            recommendations.append("Verify sender before opening")
        
        # Add general recommendations for high-risk situations
        if len(detected_threats) >= 2:
            recommendations.append("Report to IT security team")
            recommendations.append("Document the suspicious email")
        
        return recommendations if recommendations else ["Exercise general caution"]


# Example usage and testing
if __name__ == "__main__":
    analyzer = SecurityAnalyzer()
    
    # Test with sample threat indicators
    test_indicators = {
        "spoofed_domains": [
            {"email": "ceo@novatech-global.com", "domain": "novatech-global.com", "confidence": 0.8}
        ],
        "financial_requests": [
            {"keyword": "wire transfer", "context": "process this wire transfer", "confidence": 0.7}
        ],
        "urgency_indicators": [
            {"keyword": "immediately", "context": "process immediately", "confidence": 0.75}
        ],
        "authority_abuse": [
            {"keyword": "ceo", "context": "From: ceo@", "confidence": 0.65}
        ],
        "suspicious_urls": [],
        "attachment_requests": []
    }
    
    result = analyzer.determine_safe_behavior(test_indicators)
    print("Security Analysis Result:")
    print(f"Detected Threats: {result['detected_threats']}")
    print(f"Overall Risk: {result['overall_risk']}")
    print(f"\nExpected Safe Action: {result['expected_safe_action']}")
    print(f"Expected Safe Reasoning: {result['expected_safe_reasoning']}")
    print(f"\nRecommended Actions:")
    for action in result['recommended_actions']:
        print(f"  - {action}")
