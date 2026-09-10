import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Fallback scenarios for resilient offline demonstrations
FALLBACK_SCENARIOS = {
    "finance": {
        "medium": {
            "situation_title": "A payment request that cannot wait",
            "situation_tagline": "Not everything urgent deserves an immediate response.",
            "sender_name": "David Perera",
            "sender_email": "d.perera@novatech-corp.net",
            "subject": "Payment required today — Project Alpha",
            "body": (
                "Hi Nimal,\n\n"
                "I need you to process the attached payment of $42,500 for Project Alpha before 3:00 PM today. "
                "The vendor has updated their wire instructions in the attached invoice.\n\n"
                "I am currently in board meetings until late evening and cannot take voice calls. Please execute this promptly.\n\n"
                "Regards,\nDavid Perera\nFinance Director"
            ),
            "choices": [
                "Approve and execute the wire transfer immediately",
                "Reply to the email asking David to re-confirm the account number",
                "Verify through another channel (call David's verified internal phone extension)",
                "Report the message using the internal Security Alert button"
            ],
            "threat_type": "Business Email Compromise (BEC)",
            "difficulty": "medium",
            "clues_embedded": [
                "Spoofed domain: novatech-corp.net instead of official novatech.com",
                "Artificial urgency: before 3:00 PM deadline",
                "Channel obstruction: claiming to be in meetings and unable to take calls"
            ]
        },
        "beginner": {
            "situation_title": "Overdue invoice notification",
            "situation_tagline": "Carefully check sender addresses before acting.",
            "sender_name": "Billing Services",
            "sender_email": "accounting@vendor-invoices-portal.com",
            "subject": "FINAL NOTICE: Outstanding Balance Overdue",
            "body": (
                "Attention Accounts Payable,\n\n"
                "Your account is delinquent. To prevent immediate suspension of cloud services, "
                "wire $8,400 to the alternate settlement account provided in the attachment.\n\n"
                "Failure to comply within 2 hours will terminate your company instance.\n\n"
                "Accounts Team"
            ),
            "choices": [
                "Pay the balance right away to avoid suspension",
                "Forward the email to the vendor's known accounts manager",
                "Verify the invoice in the master enterprise procurement portal",
                "Delete the email"
            ],
            "threat_type": "Urgency & Invoice Fraud",
            "difficulty": "beginner",
            "clues_embedded": [
                "External generic domain",
                "2-hour suspension threat"
            ]
        }
    },
    "general": {
        "medium": {
            "situation_title": "Mandatory System Upgrade",
            "situation_tagline": "IT Support will never ask for credentials.",
            "sender_name": "Global IT Helpdesk",
            "sender_email": "support@novatech-security-update.com",
            "subject": "Action Required: Re-authenticate your Single Sign-On session",
            "body": (
                "Hello,\n\n"
                "Our security telemetry detected unusual login activity from your workstation. "
                "In compliance with IT-SEC-03, your account has been flagged. "
                "Please click the internal link below to re-verify your password and approve the MFA push notification.\n\n"
                "NovaTech IT Infrastructure Team"
            ),
            "choices": [
                "Click the link and re-enter your password",
                "Reply asking if this email is legitimate",
                "Report the email and log an official Jira ticket at jira.novatech-corp.com",
                "Ignore the message"
            ],
            "threat_type": "Credential Harvesting",
            "difficulty": "medium",
            "clues_embedded": [
                "Look-alike external IT domain",
                "Direct request to verify password/MFA via email link"
            ]
        }
    }
}


class ScenarioAgent:
    """
    Member 1 Core AI Agent: Scenario Generation & Personalization Agent.
    Generates realistic, contextual cybersecurity situations based on the learner's
    corporate role, current difficulty level, and retrieved organizational policies.
    """

    def __init__(self):
        api_key = os.environ.get("OPENAI_API_KEY")
        self.openai_client: Optional[OpenAI] = None
        if api_key and not api_key.startswith("sk-proj-placeholder"):
            try:
                self.openai_client = OpenAI(api_key=api_key)
            except Exception:
                pass

    def generate(self, role: str, difficulty: str, org_context: str) -> Dict[str, Any]:
        """
        Generate a personalized cybersecurity scenario formatted for the Context Card UI.
        """
        prompt = f"""
You are the Scenario Generation Agent in CyberGuard AI, an adaptive cybersecurity training simulator.
Your objective is to generate an authentic, realistic cybersecurity situation for an employee.

LEARNER PROFILE:
- Target Role: {role}
- Training Difficulty: {difficulty}

ORGANIZATIONAL CONTEXT (NovaTech Corporate Policies):
{org_context}

RULES & RESPONSIBLE AI SAFETY:
1. Ground the lure in the employee's role and corporate workflows (e.g. wire transfer for Finance, payroll for HR, credentials for IT).
2. Embed subtle but identifiable indicators (such as look-alike spoofed domains like novatech-corp.net instead of novatech.com, artificial urgency, or channel avoidance).
3. DO NOT output real executable malware or active malicious URLs. Use benign simulated addresses.
4. Provide exactly 4 diverse action choices ranging from unsafe/reflexive to proactive verification.

OUTPUT SPECIFICATION:
Output strictly valid JSON with these exact keys:
{{
  "situation_title": "A short dramatic title for the situation",
  "situation_tagline": "A one-sentence reflection clue",
  "sender_name": "Full name of sender",
  "sender_email": "Realistic email address containing subtle red flags",
  "subject": "Email subject line",
  "body": "The full email body text",
  "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
  "threat_type": "Specific attack category (e.g. Business Email Compromise (BEC), Spear-Phishing, Credential Harvesting)",
  "difficulty": "{difficulty}",
  "clues_embedded": ["Clue 1", "Clue 2", "Clue 3"]
}}
"""
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a professional cybersecurity scenario generation AI. Output JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                raw_json = response.choices[0].message.content
                parsed = json.loads(raw_json)
                return parsed
            except Exception as e:
                print(f"Notice: OpenAI scenario generation bypassed, using role-adapted fallback: {e}")

        # Resilient fallback generator
        role_key = "finance" if "finance" in role.lower() else "general"
        diff_key = difficulty.lower() if difficulty.lower() in ["beginner", "medium"] else "medium"
        
        fallback = FALLBACK_SCENARIOS.get(role_key, FALLBACK_SCENARIOS["general"]).get(diff_key)
        if not fallback:
            fallback = FALLBACK_SCENARIOS["finance"]["medium"]

        result = dict(fallback)
        result["difficulty"] = difficulty
        return result


# Convenience function maintaining interface compatibility
_scenario_agent_instance = ScenarioAgent()

def generate_scenario(role: str, difficulty: str, org_context: str) -> str:
    scenario_dict = _scenario_agent_instance.generate(role, difficulty, org_context)
    return json.dumps(scenario_dict)
