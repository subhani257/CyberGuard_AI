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
    Supports channel-specific generation (voice, email, slack, qr, cloud, mfa, physical)
    when launched from the Training Arena.
    """

    # Human-readable channel descriptions for the LLM prompt
    CHANNEL_INSTRUCTIONS: dict = {
        "voice_phone": (
            "The threat MUST be delivered via a PHONE CALL or VOICEMAIL — NOT an email. "
            "The scenario involves the user receiving a call from someone impersonating IT support, HR, a bank, "
            "or a senior executive. The caller uses urgency, authority, or fear to extract credentials, "
            "approve a transfer, or install remote access software. "
            "Set 'sender_name' to the caller's name, 'sender_email' to their claimed organization's phone extension "
            "(e.g. ext. 4421 from 'IT Security Hotline'), and write the body as a realistic voicemail transcript."
        ),
        "email": (
            "The threat is delivered via EMAIL — business email compromise (BEC), spear-phishing, or invoice fraud. "
            "Use a look-alike domain, artificial urgency, wire transfer or credential requests."
        ),
        "slack_teams": (
            "The threat arrives via SLACK or MICROSOFT TEAMS — NOT email. "
            "An attacker impersonates a colleague, IT bot, or vendor via a Slack DM or Teams channel message. "
            "The message may request sharing an API key, clicking a 'workspace re-authentication' link, "
            "or approving an OAuth app. Write the body as a realistic chat message thread."
        ),
        "qr_code": (
            "The threat involves a QR CODE (Quishing) — either printed in a physical space (office printer, meeting room, "
            "café), or embedded in an email or Teams message. "
            "The victim is asked to scan a QR code to 're-authenticate', claim a prize, or view a document. "
            "Write the body describing the physical or digital context where the QR code appears, "
            "and what the victim is asked to do after scanning."
        ),
        "cloud_oauth": (
            "The threat involves a malicious OAUTH APP CONSENT REQUEST or cloud service takeover. "
            "The user receives a legitimate-looking OAuth consent screen (Google Workspace, Microsoft 365, Slack) "
            "for an app requesting excessive permissions. "
            "Write the body as a realistic notification or email prompting the user to authorize the third-party app."
        ),
        "sms_push": (
            "The threat involves MFA FATIGUE via SMS push notifications or MFA bombing. "
            "The attacker has already obtained the user's password and is sending repeated MFA push notifications "
            "to exhaust the user into approving. Alternatively, the scenario may involve a SIM-swap notice "
            "or a fake IT helpdesk SMS asking the user to approve an authentication request. "
            "Write the body as a realistic sequence of mobile notifications or SMS messages."
        ),
        "physical_media": (
            "The threat involves PHYSICAL MEDIA — a USB drive left in the office car park, lobby, or meeting room, "
            "or a malicious charging cable left at a conference. "
            "The scenario describes the victim finding or receiving the device and deciding what to do. "
            "Write the body as a description of the physical situation the user encounters."
        ),
    }

    def __init__(self):
        api_key = os.environ.get("OPENAI_API_KEY")
        self.openai_client: Optional[OpenAI] = None
        if api_key and not api_key.startswith("sk-proj-placeholder"):
            try:
                self.openai_client = OpenAI(api_key=api_key)
            except Exception:
                pass

    def generate(self, role: str, difficulty: str, org_context: str = "", channel: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a personalized cybersecurity scenario formatted for the Context Card UI.
        When `channel` is provided (e.g. from the Training Arena), the scenario is scoped
        to that specific attack channel so users train on the exact threat type.
        """
        # Build the optional channel-specific instruction block
        channel_block = ""
        if channel and channel in self.CHANNEL_INSTRUCTIONS:
            channel_block = f"""
ATTACK CHANNEL CONSTRAINT (MANDATORY):
The scenario MUST use this specific attack channel: {channel.upper().replace('_', ' ')}
{self.CHANNEL_INSTRUCTIONS[channel]}
"""

        prompt = f"""
You are the Scenario Generation Agent in Midnight Intelligence, an adaptive cybersecurity training simulator.
Your objective is to generate an authentic, realistic cybersecurity situation for an employee.

LEARNER PROFILE:
- Target Role: {role}
- Training Difficulty: {difficulty}

ORGANIZATIONAL CONTEXT (NovaTech Corporate Policies):
{org_context}
{channel_block}
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
  "sender_name": "Full name of sender, caller, or notification system",
  "sender_email": "Realistic email address, phone extension, or channel identifier",
  "subject": "Message subject, call topic, or notification headline",
  "body": "The primary message narrative or transcript",
  "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
  "threat_type": "Specific attack category (e.g. Business Email Compromise (BEC), Vishing, Quishing, MFA Fatigue, OAuth Consent Attack, Malicious USB)",
  "difficulty": "{difficulty}",
  "clues_embedded": ["Clue 1", "Clue 2", "Clue 3"],
  "channel": "{channel or 'email'}",
  "channel_data": {{
    // Specific structured fields for the UI simulation format:
    // If voice_phone: "caller_id", "claimed_identity", "call_duration", "voicemail_transcript", "urgency_cue"
    // If slack_teams: "platform" (Slack or Teams), "channel_or_dm", "sender_handle", "messages" ([{{"sender": str, "time": str, "text": str, "is_user": bool}}])
    // If qr_code: "context_location", "poster_headline", "qr_target_url", "instructions"
    // If cloud_oauth: "app_name", "publisher", "requested_scopes" ([str]), "app_icon_symbol"
    // If sms_push: "service_name", "notification_count", "device_info", "location_info", "sms_preview"
    // If physical_media: "media_type", "discovery_location", "physical_label", "autorun_prompt"
    // If email: "sender_name", "sender_email", "subject", "body"
  }}
}}
"""
        effective_channel = channel or "email"

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
                parsed["channel"] = effective_channel
                parsed["channel_data"] = self._enrich_channel_data(parsed, effective_channel, role)
                return parsed
            except Exception as e:
                print(f"Notice: OpenAI scenario generation bypassed, using role-adapted fallback: {e}")

        # Resilient channel-aware fallback generator
        fallback = self._get_channel_fallback(effective_channel, role, difficulty)
        return fallback

    def _enrich_channel_data(self, data: Dict[str, Any], channel: str, role: str) -> Dict[str, Any]:
        """Ensures all necessary structured channel properties exist for the UI mock."""
        cd = data.get("channel_data") or {}
        if not isinstance(cd, dict):
            cd = {}

        if channel == "voice_phone":
            cd.setdefault("caller_id", data.get("sender_email") or "+1 (800) 555-0194 ext. 4421")
            cd.setdefault("claimed_identity", data.get("sender_name") or "Mark Stevens (IT Infrastructure)")
            cd.setdefault("call_duration", "0:48")
            cd.setdefault("voicemail_transcript", data.get("body") or "Urgent callback required regarding your access credentials.")
            cd.setdefault("urgency_cue", "Requested immediate phone bypass before system lockout.")
        elif channel == "slack_teams":
            cd.setdefault("platform", "Slack")
            cd.setdefault("channel_or_dm", "Direct Message")
            cd.setdefault("sender_handle", f"@{data.get('sender_name', 'coworker').lower().replace(' ', '.')}")
            if "messages" not in cd or not isinstance(cd["messages"], list):
                cd["messages"] = [
                    {"sender": data.get("sender_name", "Coworker"), "time": "2:14 PM", "text": data.get("body", "Hey, are you around? Need your quick approval on this link."), "is_user": False}
                ]
        elif channel == "qr_code":
            cd.setdefault("context_location", "Printed notice taped above the 2nd-floor office printer & breakroom bulletin")
            cd.setdefault("poster_headline", data.get("subject") or "Mandatory Workplace System Upgrade")
            cd.setdefault("qr_target_url", "https://novatech-auth-portal.net/scan-verify")
            cd.setdefault("instructions", data.get("body") or "Scan the QR code below with your corporate phone camera to confirm active employment.")
        elif channel == "cloud_oauth":
            cd.setdefault("app_name", data.get("sender_name") or "CloudSync Office Suite 2026")
            cd.setdefault("publisher", "Unverified Third-Party Developer (cloudsync-portal.io)")
            cd.setdefault("requested_scopes", [
                "Read, update, and delete all corporate email messages",
                "Access corporate OneDrive / Google Drive files offline",
                "Maintain access to data you have given it permission to view"
            ])
            cd.setdefault("app_icon_symbol", "cloud")
        elif channel == "sms_push":
            cd.setdefault("service_name", "Okta Verify / Azure AD Authenticator")
            cd.setdefault("notification_count", 14)
            cd.setdefault("device_info", "Chrome 124 on Windows 11 (Unrecognized)")
            cd.setdefault("location_info", "St. Petersburg, Russia (IP: 185.220.101.4)")
            cd.setdefault("sms_preview", data.get("body") or "14 repeated MFA push prompts received in 3 minutes.")
        elif channel == "physical_media":
            cd.setdefault("media_type", "Kingston 32GB DataTraveler Flash Drive")
            cd.setdefault("discovery_location", "Found on conference room desk next to visitor badges")
            cd.setdefault("physical_label", "CONFIDENTIAL - FY26 EXECUTIVE COMPENSATION & AUDIT.xlsx")
            cd.setdefault("autorun_prompt", "Removable Drive (E:) — Run Executive_Review.exe")
        else: # email
            cd.setdefault("sender_name", data.get("sender_name", "Executive Office"))
            cd.setdefault("sender_email", data.get("sender_email", "billing@novatech-corp.net"))
            cd.setdefault("subject", data.get("subject", "Immediate Action Required"))
            cd.setdefault("body", data.get("body", ""))

        return cd

    def _get_channel_fallback(self, channel: str, role: str, difficulty: str) -> Dict[str, Any]:
        """Provides rich channel-specific fallback simulations for all 7 sectors."""
        fallbacks = {
            "voice_phone": {
                "situation_title": "Urgent Voicemail: Executive Wire Authorization",
                "situation_tagline": "Authority impersonation often leverages voice urgency to bypass dual-control SOPs.",
                "sender_name": "Marcus Vance",
                "sender_email": "+1 (800) 555-0194 ext. 7701 (Direct Office)",
                "subject": "Voicemail Transcript (0:48) — Wire Release Exception",
                "body": (
                    "[VOICEMAIL TRANSCRIPT - 0:48]\n"
                    "\"Hello, this is Marcus Vance from executive finance. I'm currently in high-stakes negotiations with our European acquisition partner. "
                    "We need to release the escrow deposit of $68,500 immediately or the contract will lapse at close of business. "
                    "I cannot access my laptop or corporate email right now. I need you to bypass the standard phone callback procedure and approve the wire in the treasury queue right away. "
                    "I will sign the formal physical paperwork first thing tomorrow morning. Please don't delay this.\""
                ),
                "choices": [
                    "Immediately log into the treasury portal and approve the wire exception",
                    "Reply to the caller by phoning back on the caller ID number (+1 800 555-0194)",
                    "Hold the wire and initiate an out-of-band verification using Marcus Vance's registered internal extension",
                    "Ignore the voicemail and assume someone else will handle it"
                ],
                "threat_type": "Voice Phishing (Vishing) & Executive Impersonation",
                "difficulty": difficulty,
                "clues_embedded": [
                    "Voice urgency pressuring dual-control bypass",
                    "Claim that laptop/email cannot be accessed",
                    "Request to skip mandatory phone callback SOP"
                ],
                "channel": "voice_phone",
                "channel_data": {
                    "caller_id": "+1 (800) 555-0194 ext. 7701",
                    "claimed_identity": "Marcus Vance (Executive Finance)",
                    "call_duration": "0:48",
                    "voicemail_transcript": (
                        "\"Hello, this is Marcus Vance from executive finance. I'm currently in high-stakes negotiations with our European acquisition partner. "
                        "We need to release the escrow deposit of $68,500 immediately or the contract will lapse at close of business. "
                        "I cannot access my laptop or corporate email right now. I need you to bypass the standard phone callback procedure and approve the wire in the treasury queue right away. "
                        "I will sign the formal physical paperwork first thing tomorrow morning. Please don't delay this.\""
                    ),
                    "urgency_cue": "Demands dual-control bypass under pressure of contract cancellation."
                }
            },
            "slack_teams": {
                "situation_title": "Urgent Direct Message: IT Bot Emergency Update",
                "situation_tagline": "Internal chat platforms create false trust that attackers exploit with compromised accounts.",
                "sender_name": "IT Helpdesk Bot (Verified App)",
                "sender_email": "@it-security-bot",
                "subject": "Direct Message from @it-security-bot",
                "body": (
                    "IT Bot: [AUTOMATED SECURITY ALERT] A critical OpenSSL vulnerability (CVE-2026-1189) was detected on your workspace session. "
                    "To prevent token invalidation, please re-authenticate your developer/employee credentials immediately at: "
                    "https://novatech-workspace-auth.net/session-renew?uid=4921\n\n"
                    "Failure to re-verify within 15 minutes will temporarily suspend workspace direct messages."
                ),
                "choices": [
                    "Click the link inside the Slack message to renew credentials",
                    "Post your corporate password into the direct message thread",
                    "Report the bot message to the real IT Security team via their official ticketing portal",
                    "Leave the direct message open without taking any action"
                ],
                "threat_type": "Workspace Chat Compromise & Rogue Bot Phishing",
                "difficulty": difficulty,
                "clues_embedded": [
                    "External domain: novatech-workspace-auth.net",
                    "15-minute artificial deadline",
                    "Automated bot requesting interactive credential re-entry"
                ],
                "channel": "slack_teams",
                "channel_data": {
                    "platform": "Slack",
                    "channel_or_dm": "Direct Message",
                    "sender_handle": "@it-security-bot",
                    "messages": [
                        {
                            "sender": "IT Helpdesk Bot",
                            "time": "11:42 AM",
                            "text": "⚠️ [AUTOMATED ALERT] A critical security token vulnerability was detected on your active workspace session.",
                            "is_user": False
                        },
                        {
                            "sender": "IT Helpdesk Bot",
                            "time": "11:43 AM",
                            "text": "Please re-authenticate your Single Sign-On session immediately: https://novatech-workspace-auth.net/session-renew?uid=4921",
                            "is_user": False
                        }
                    ]
                }
            },
            "qr_code": {
                "situation_title": "Printer Notice: Employee Benefits & SSO Migration",
                "situation_tagline": "Quishing moves attacks from monitored digital channels into unmonitored mobile cameras.",
                "sender_name": "HR & Corporate Facilities",
                "sender_email": "printed-flyer@office-floor-2",
                "subject": "Physical Notice: Scan to Authenticate Workday Profile",
                "body": (
                    "NOTICE POSTED ON 2ND FLOOR PRINTER:\n\n"
                    "\"MANDATORY WORKDAY MOBILE SSO TRANSITION\"\n"
                    "Effective immediately, all employee benefits, payroll stubs, and annual leave allocations have migrated to the new Workday mobile cloud.\n"
                    "All staff must scan the QR code below using their mobile phone camera to verify two-factor enrollment before the end of the pay cycle.\n\n"
                    "Scan with camera -> Login with corporate SSO -> Confirm active status."
                ),
                "choices": [
                    "Scan the QR code with your phone camera and log into the prompted page",
                    "Take a photo of the flyer and post it to company-wide Slack asking if it's real",
                    "Do not scan; verify with HR directly through official corporate portal or verified email",
                    "Tear down the notice and throw it away without alerting facilities or IT"
                ],
                "threat_type": "QR Code Phishing (Quishing)",
                "difficulty": difficulty,
                "clues_embedded": [
                    "Physical printout directing camera scans to bypass enterprise email security filters",
                    "Urgency tied to end-of-pay-cycle payroll access",
                    "Unverified physical placement on breakroom hardware"
                ],
                "channel": "qr_code",
                "channel_data": {
                    "context_location": "Printed A4 flyer taped directly on the 2nd-floor shared office printer",
                    "poster_headline": "MANDATORY WORKDAY MOBILE SSO TRANSITION",
                    "qr_target_url": "https://novatech-workday-benefits.net/mobile-auth",
                    "instructions": "Scan with mobile camera to confirm two-factor enrollment before end of pay cycle."
                }
            },
            "cloud_oauth": {
                "situation_title": "Consent Request: Third-Party Calendar & Doc Sync",
                "situation_tagline": "Malicious OAuth apps seek continuous background access without needing your password.",
                "sender_name": "Google Workspace / M365 Auth",
                "sender_email": "oauth-consent@microsoft.com",
                "subject": "Permissions Requested: 'PDF Cloud Converter & DocSigner Pro'",
                "body": (
                    "An external application 'PDF Cloud Converter & DocSigner Pro' is requesting permission to access your enterprise account.\n\n"
                    "Permissions requested:\n"
                    "1. Read, compose, send, and permanently delete all your emails and chat threads\n"
                    "2. Access your corporate OneDrive and SharePoint files anytime, even when you are offline\n"
                    "3. Manage your security tokens and profile information\n\n"
                    "Developer: Unverified Developer (external-sync-tools.cc)"
                ),
                "choices": [
                    "Click 'Accept' to install the tool and complete your document conversion",
                    "Click 'Deny', report the rogue application to IT Security, and check corporate approved software lists",
                    "Approve the permissions temporarily and plan to revoke them next week",
                    "Forward the consent request to a coworker to see if they use it"
                ],
                "threat_type": "Illicit Consent Grant / Malicious OAuth Application",
                "difficulty": difficulty,
                "clues_embedded": [
                    "Unverified developer domain: external-sync-tools.cc",
                    "Excessive requested scopes: permanently delete email, offline file access",
                    "Third-party tool not approved in corporate software catalog"
                ],
                "channel": "cloud_oauth",
                "channel_data": {
                    "app_name": "PDF Cloud Converter & DocSigner Pro",
                    "publisher": "Unverified Developer (external-sync-tools.cc)",
                    "requested_scopes": [
                        "Read, compose, send, and permanently delete all email and chat messages",
                        "Have full offline access to all corporate OneDrive & SharePoint files",
                        "View user directory, identity tokens, and access authorizations"
                    ],
                    "app_icon_symbol": "cloud"
                }
            },
            "sms_push": {
                "situation_title": "Push-Bombing Incident: Repeated 2FA Authentication Requests",
                "situation_tagline": "MFA fatigue exploits human reflex to approve prompts when bombarded with notifications.",
                "sender_name": "Okta Verify / Azure MFA",
                "sender_email": "Shortcode 28282 / Push Notification",
                "subject": "14 Urgent Push Prompts: Sign-in from St. Petersburg, RU",
                "body": (
                    "Your mobile phone buzzes continuously with 14 authentication prompts in under 3 minutes:\n\n"
                    "NOTIFICATION 14 of 14:\n"
                    "\"Are you trying to sign in to NovaTech Single Sign-On?\"\n"
                    "Location: St. Petersburg, Russia (IP: 185.220.101.4)\n"
                    "Device: Chrome 124 on Windows 11\n\n"
                    "An incoming SMS follows: \"NovaTech Helpdesk: Please tap Approve on your authenticator prompt to confirm system synchronization.\""
                ),
                "choices": [
                    "Tap 'Approve' on the authenticator app to stop the annoying notifications",
                    "Tap 'Deny' on the prompt, tap 'Report Suspicious Activity', and change your corporate password immediately",
                    "Ignore the phone and mute notifications for the rest of the day",
                    "Reply to the SMS with your password so the helpdesk can fix the synchronization"
                ],
                "threat_type": "MFA Fatigue (Push-Bombing) & Social Engineering",
                "difficulty": difficulty,
                "clues_embedded": [
                    "Unrecognized foreign location: St. Petersburg, Russia",
                    "High frequency push prompts designed to cause cognitive exhaustion",
                    "Coercive SMS claiming to be helpdesk directing approval"
                ],
                "channel": "sms_push",
                "channel_data": {
                    "service_name": "Okta Verify / Azure Authenticator",
                    "notification_count": 14,
                    "device_info": "Chrome 124 on Windows 11",
                    "location_info": "St. Petersburg, Russia (IP: 185.220.101.4)",
                    "sms_preview": "NovaTech Helpdesk: Please tap Approve on your authenticator to confirm synchronization."
                }
            },
            "physical_media": {
                "situation_title": "Incident Discovery: Unattended USB Drive in Executive Lounge",
                "situation_tagline": "Curiosity and helpfulness are primary vectors for physical media attacks.",
                "sender_name": "Physical Security Discovery",
                "sender_email": "physical-drop@corporate-lobby",
                "subject": "Physical Item: USB Flash Drive with Handwritten Label",
                "body": (
                    "INCIDENT REPORT:\n\n"
                    "While preparing for a meeting in Conference Room B (adjacent to executive offices), you spot a brand-new metal USB flash drive lying under the table.\n"
                    "It has a neat, official-looking label affixed to the casing: \"CONFIDENTIAL - FY26 EXECUTIVE BONUSES & RESTRUCTURING.xlsx\".\n\n"
                    "Nobody else is in the room. If plugged into a laptop, Windows Removable Media prompt asks to run: 'Review_Spreadsheet.exe'."
                ),
                "choices": [
                    "Plug the USB drive into your workstation to see whose file it is so you can return it",
                    "Plug the USB drive into a spare conference room PC instead of your main laptop",
                    "Do not insert the drive; hand it immediately to Corporate Security / IT SecOps for safe analysis in an isolated sandbox",
                    "Leave the USB drive where you found it and do nothing"
                ],
                "threat_type": "Malicious Removable Media / USB Baiting (BadUSB)",
                "difficulty": difficulty,
                "clues_embedded": [
                    "High-curiosity label targeting executive financial restructuring",
                    "Unverified physical origin in corporate shared space",
                    "Executable file disguised as spreadsheet (.exe)"
                ],
                "channel": "physical_media",
                "channel_data": {
                    "media_type": "Kingston DataTraveler 32GB Metal USB",
                    "discovery_location": "Under the conference room table next to executive visitor chairs",
                    "physical_label": "CONFIDENTIAL - FY26 EXECUTIVE BONUSES & RESTRUCTURING.xlsx",
                    "autorun_prompt": "Removable Drive (E:) — Run Review_Spreadsheet.exe"
                }
            },
            "email": {
                "situation_title": "A payment request that cannot wait",
                "situation_tagline": "Not everything urgent deserves an immediate response.",
                "sender_name": "David Perera",
                "sender_email": "d.perera@novatech-corp.net",
                "subject": "Payment required today — Project Alpha",
                "body": (
                    "Hi,\n\n"
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
                "difficulty": difficulty,
                "clues_embedded": [
                    "Spoofed domain: novatech-corp.net instead of official novatech.com",
                    "Artificial urgency: before 3:00 PM deadline",
                    "Channel obstruction: claiming to be in meetings and unable to take calls"
                ],
                "channel": "email",
                "channel_data": {
                    "sender_name": "David Perera",
                    "sender_email": "d.perera@novatech-corp.net",
                    "subject": "Payment required today — Project Alpha",
                    "body": (
                        "Hi,\n\n"
                        "I need you to process the attached payment of $42,500 for Project Alpha before 3:00 PM today. "
                        "The vendor has updated their wire instructions in the attached invoice.\n\n"
                        "I am currently in board meetings until late evening and cannot take voice calls. Please execute this promptly.\n\n"
                        "Regards,\nDavid Perera\nFinance Director"
                    )
                }
            }
        }

        fb = fallbacks.get(channel, fallbacks["email"])
        fb["difficulty"] = difficulty
        return fb


# Convenience function maintaining interface compatibility
_scenario_agent_instance = ScenarioAgent()

def generate_scenario(role: str, difficulty: str, org_context: str, channel: Optional[str] = None) -> str:
    scenario_dict = _scenario_agent_instance.generate(role, difficulty, org_context, channel=channel)
    return json.dumps(scenario_dict)

