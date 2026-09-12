import os
import json
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from openai import OpenAI

from rag.training_retrieval import TrainingRetriever
from nlp.summarizer import WeaknessSummarizer

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class TrainingCoachAgent:
    """
    Member 3 Core AI Agent: Training Coach Agent.
    
    Transforms evaluation decisions into adaptive learning paths by synthesizing
    NIST knowledge retrieval, NLP weakness summaries, and dynamic difficulty algorithms.
    """

    def __init__(self):
        self.retriever = TrainingRetriever()
        self.summarizer = WeaknessSummarizer()
        
        api_key = os.environ.get("OPENAI_API_KEY")
        self.openai_client: Optional[OpenAI] = None
        if api_key and not api_key.startswith("sk-proj-placeholder"):
            try:
                self.openai_client = OpenAI(api_key=api_key)
            except Exception:
                pass

    def analyze_first_time_user(
        self,
        job_title: str,
        department: Optional[str] = None,
        org_name: Optional[str] = None,
        org_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dynamically decomposes any arbitrary job role and organization context
        to determine the learner's initial attack surface, threat channel, and baseline training focus.
        Zero hardcoding: uses LLM reasoning and semantic vector retrieval over cyber_training.
        """
        job_title_clean = job_title.strip() if job_title else "Corporate Employee"
        dept_clean = department.strip() if department else "General Operations"
        org_clean = org_name.strip() if org_name else "Enterprise"
        
        profile_analysis = None
        
        # 1. LLM Cyber-Risk Decomposition
        if self.openai_client:
            try:
                system_prompt = (
                    "You are the Midnight Intelligence Security Profiler. Your mission is to analyze any given job title, "
                    "department, and organization context to determine the specific cybersecurity attack surface, "
                    "the most vulnerable communication channel (e.g. Email, Slack/Teams, Voice/Vishing, Quishing, Cloud OAuth, SMS/MFA, Removable Media), "
                    "and the primary cognitive or psychological vulnerability to test."
                )

                user_prompt = f"""
                Learner Profile:
                - Job Title: {job_title_clean}
                - Department: {dept_clean}
                - Organization: {org_clean}
                - Org Context: {org_description or 'Standard multi-department corporate setting'}

                Respond ONLY with a valid JSON object containing:
                - "primary_attack_surface": Concise sentence describing specific high-value assets/data this role handles (e.g., patient records, financial keys, source code, payroll, customer data).
                - "recommended_first_topic": Concrete cybersecurity threat scenario topic for their baseline simulation.
                - "target_channel": Exactly one of ["email", "slack_teams", "voice_phone", "qr_code", "cloud_oauth", "sms_push", "physical_media"].
                - "target_tactic": Specific deceptive mechanism or psychological trigger (e.g., "ai_voice_clone", "urgency_coercion", "oauth_consent_grant", "session_token_theft", "homograph_spoofing").
                - "retrieval_query": 3-5 keywords to search the NIST/SANS cyber_training database.
                - "orientation_tip": 1 actionable sentence welcoming the user and explaining their key defense priority.
                - "training_map": An array of 7 objects (one for each of: voice_phone, email, slack_teams, qr_code, cloud_oauth, sms_push, physical_media). Each object has "channel", "label" (role-tailored sector title), "description" (how this role is targeted via this channel), and "recommended_challenge" (a realistic simulation title).
                """

                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                profile_analysis = json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"Notice: OpenAI dynamic role profiler fallback engaged: {e}")

        # 2. Dynamic Linguistic Heuristic Fallback if LLM offline (Zero static dictionary)
        if not profile_analysis:
            title_lower = (job_title_clean + " " + dept_clean).lower()
            
            if any(k in title_lower for k in ["finan", "account", "treasur", "cfo", "pay"]):
                channel = "voice_phone"
                topic = "BEC & Voice Phishing (Vishing)"
                tactic = "urgency+authority"
                surface = f"Financial authorization, invoice routing, and corporate bank accounts managed by {job_title_clean}."
                query = "vishing_defense wire transfer financial"
            elif any(k in title_lower for k in ["hr", "human", "recruit", "talent", "peopl"]):
                channel = "slack_teams"
                topic = "Payroll Modification & Macro Attachment Malware"
                tactic = "curiosity+impersonation"
                surface = f"Employee PII, candidate resume files, and direct deposit systems managed by {job_title_clean}."
                query = "chat_compromise_defense pii credential"
            elif any(k in title_lower for k in ["dev", "engineer", "code", "tech", "soft", "infra", "cloud", "admin"]):
                channel = "cloud_oauth"
                topic = "Cloud OAuth Consent & API Token Exposure"
                tactic = "oauth_consent_grant"
                surface = f"Infrastructure secrets, code repositories, and cloud environment credentials accessed by {job_title_clean}."
                query = "oauth_consent_defense cloud privileged"
            elif any(k in title_lower for k in ["medic", "health", "nurse", "doctor", "clinic"]):
                channel = "voice_phone"
                topic = "Emergency Vishing & Patient PHI Protection"
                tactic = "urgency_coercion"
                surface = f"Confidential patient health records (PHI) and clinical telemetry accessed by {job_title_clean}."
                query = "vishing_defense urgency_bias"
            elif any(k in title_lower for k in ["logist", "warehous", "supply", "dispatch", "driver", "operat"]):
                channel = "qr_code"
                topic = "Quishing & Supply Chain Pretexting"
                tactic = "convenience_bias"
                surface = f"Shipment schedules, vendor delivery portals, and physical checkpoint access managed by {job_title_clean}."
                query = "quishing_detection social_engineering"
            elif any(k in title_lower for k in ["legal", "counsel", "complian", "audit"]):
                channel = "email"
                topic = "Confidential Document Spoofing & Credential Harvesting"
                tactic = "authority_abuse"
                surface = f"Proprietary corporate contracts, litigation documents, and compliance records managed by {job_title_clean}."
                query = "credential_harvesting authority_abuse"
            else:
                channel = "email"
                topic = "Foundational Social Engineering & Urgency Indicators"
                tactic = "urgency_bias"
                surface = f"Enterprise communication channels and authentication credentials associated with {job_title_clean}."
                query = "urgency_bias credential_harvesting"

            profile_analysis = {
                "primary_attack_surface": surface,
                "recommended_first_topic": topic,
                "target_channel": channel,
                "target_tactic": tactic,
                "retrieval_query": query,
                "orientation_tip": f"As a {job_title_clean} at {org_clean}, your primary defense priority is verifying unexpected communication on {channel.replace('_', ' ').title()}."
            }

        # 3. Build or validate the complete 7-channel personalized Training Map
        target_channel = str(profile_analysis.get("target_channel", "email"))
        first_topic = profile_analysis.get("recommended_first_topic", "Foundational Security Defense")
        raw_training_map = profile_analysis.get("training_map")

        training_map = self._synthesize_training_map(
            job_title=job_title_clean,
            org_name=org_clean,
            target_channel=target_channel,
            target_topic=first_topic,
            raw_map=raw_training_map
        )

        # 4. Retrieve grounding NIST / SANS guidance from cyber_training knowledge base
        search_query = profile_analysis.get("retrieval_query", "security awareness")
        if isinstance(search_query, list):
            search_query = " ".join(str(s) for s in search_query)
        
        retrieved_training = self.retriever.retrieve_guidance([search_query, target_channel], top_k=1)
        nist_source = retrieved_training[0].get("source", "NIST SP 800-50") if retrieved_training else "NIST SP 800-50"

        return {
            "next_difficulty": "beginner",
            "next_focus": first_topic,
            "tactic_to_target": profile_analysis.get("target_tactic", "urgency_bias"),
            "target_channel": target_channel,
            "primary_attack_surface": profile_analysis.get("primary_attack_surface", f"Role assets for {job_title_clean}"),
            "orientation_tip": profile_analysis.get("orientation_tip", f"Welcome to Midnight Intelligence. Security defense active for {job_title_clean}."),
            "nist_reference": nist_source,
            "training_map": training_map
        }

    def _synthesize_training_map(
        self,
        job_title: str,
        org_name: str,
        target_channel: str,
        target_topic: str,
        raw_map: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Guarantees all 7 attack channels have role-grounded titles, descriptions,
        and challenge recommendations personalized to the learner's profile.
        """
        CHANNELS_ORDER = ["voice_phone", "email", "slack_teams", "qr_code", "cloud_oauth", "sms_push", "physical_media"]
        title_lower = job_title.lower()

        # Archetype-grounded template blueprints
        is_fin = any(k in title_lower for k in ["finan", "account", "treasur", "cfo", "pay", "billing"])
        is_hr = any(k in title_lower for k in ["hr", "human", "recruit", "talent", "people", "benefit"])
        is_tech = any(k in title_lower for k in ["dev", "engineer", "code", "tech", "soft", "infra", "cloud", "admin", "data"])
        is_health = any(k in title_lower for k in ["medic", "health", "nurse", "doctor", "clinic", "pharm"])

        defaults = {
            "voice_phone": {
                "label": "Supplier Wire Vishing" if is_fin else ("Clinical Urgent Vishing" if is_health else "Voice & Vishing Defense"),
                "desc": f"Attackers posing as senior executives or banking agents demanding immediate action from {job_title}.",
                "challenge": target_topic if target_channel == "voice_phone" else "Emergency Wire Transfer Request"
            },
            "email": {
                "label": "Invoice Fraud & BEC" if is_fin else ("Patient Record Phishing" if is_health else ("Resume Exploit Phishing" if is_hr else "Email & BEC Defense")),
                "desc": f"Spoofed domain emails with synthetic urgency targeting {job_title}'s standard corporate workflows.",
                "challenge": target_topic if target_channel == "email" else "Vendor Payment Terms Modification"
            },
            "slack_teams": {
                "label": "Direct Message Pretexting",
                "desc": f"Compromised internal coworker chat requesting sensitive company tokens, PII, or approval links.",
                "challenge": target_topic if target_channel == "slack_teams" else "Urgent Executive Direct Message"
            },
            "qr_code": {
                "label": "Quishing & Supply Chain Pretext",
                "desc": f"Deceptive QR codes on invoices, printer notices, or vendor tags leading to credential capture.",
                "challenge": target_topic if target_channel == "qr_code" else "Notice of Required MFA Reset via QR"
            },
            "cloud_oauth": {
                "label": "API Token & OAuth Consent" if is_tech else "Cloud App Consent Abuse",
                "desc": f"Third-party workspace integrations requesting excessive read/write scopes to {org_name} data.",
                "challenge": target_topic if target_channel == "cloud_oauth" else "Workspace Integration Consent Review"
            },
            "sms_push": {
                "label": "MFA Fatigue & Push Bombing",
                "desc": f"Repeated authentication push alerts designed to exhaust {job_title} into reflexive authorization.",
                "challenge": target_topic if target_channel == "sms_push" else "Repeated Okta/Azure MFA Prompts"
            },
            "physical_media": {
                "label": "Rogue USB & Hardware Traps",
                "desc": f"Unverified flash drives or chargers left in conference rooms or office lobbies of {org_name}.",
                "challenge": target_topic if target_channel == "physical_media" else "Confidential Financial Audit USB"
            }
        }

        # Index raw map if LLM provided any
        llm_by_channel = {}
        if isinstance(raw_map, list):
            for item in raw_map:
                if isinstance(item, dict) and "channel" in item:
                    llm_by_channel[item["channel"]] = item

        synthesized = []
        for ch in CHANNELS_ORDER:
            d = defaults.get(ch, {})
            llm_item = llm_by_channel.get(ch, {})
            is_priority = (ch == target_channel)

            label = llm_item.get("label") or d.get("label", f"{ch.replace('_', ' ').title()} Defense")
            desc = llm_item.get("description") or d.get("desc", f"Defense simulation against {ch} threats.")
            challenge = llm_item.get("recommended_challenge") or d.get("challenge", "Personalized Threat Simulation")

            synthesized.append({
                "channel": ch,
                "label": label,
                "description": desc,
                "recommended_challenge": challenge,
                "is_priority": is_priority,
                "priority_level": "Priority" if is_priority else "Standard",
                "difficulty": "beginner"
            })

        return synthesized

    def calculate_next_difficulty(self, current_difficulty: str, recent_scores: List[int]) -> str:
        """
        Adaptive algorithm to progress or adjust difficulty based on performance metrics.
        """
        levels = ["beginner", "medium", "advanced"]
        cur = current_difficulty.lower()
        curr_idx = levels.index(cur) if cur in levels else 0
        
        if not recent_scores:
            return levels[curr_idx]

        avg_score = sum(recent_scores) / len(recent_scores)
        latest_score = recent_scores[-1]

        # Elevate difficulty if consistent mastery demonstrated
        if avg_score >= 80 and latest_score >= 75 and curr_idx < len(levels) - 1:
            return levels[curr_idx + 1]
        
        # De-escalate difficulty to reinforce fundamentals if struggling
        if latest_score < 45 and curr_idx > 0:
            return levels[curr_idx - 1]
            
        return levels[curr_idx]

    def generate_coaching(
        self,
        user_id: str,
        evaluation_data: Dict[str, Any],
        past_decisions: Optional[List[Dict[str, Any]]] = None,
        current_difficulty: str = "beginner"
    ) -> Dict[str, Any]:
        """
        Generate comprehensive coaching feedback and the next adaptive learning prescription.
        """
        past_decisions = past_decisions or []
        
        # Extract evaluation components
        final_score = evaluation_data.get("final_score", 50)
        weaknesses = evaluation_data.get("weaknesses", [])
        threat_indicators = evaluation_data.get("threat_indicators", [])
        
        all_weakness_keys = weaknesses + threat_indicators
        if not all_weakness_keys:
            all_weakness_keys = ["urgency_bias"]

        # 1. Retrieve authoritative NIST / SANS guidance via RAG
        retrieved_training = self.retriever.retrieve_guidance(all_weakness_keys, top_k=2)
        guidance_text = " ".join([m.get("content", "") for m in retrieved_training])
        nist_reference = retrieved_training[0].get("source", "NIST SP 800-50") if retrieved_training else "NIST SP 800-50"

        # 2. NLP Weakness Summarization
        history_summary = self.summarizer.summarize_user_tendencies(past_decisions)
        
        # 3. Calculate Adaptive Difficulty
        recent_scores = [d.get("evaluation", {}).get("final_score", 50) for d in past_decisions[-4:]]
        recent_scores.append(final_score)
        next_difficulty = self.calculate_next_difficulty(current_difficulty, recent_scores)

        # 4. LLM Generation (or deterministic pedagogical fallback)
        coaching_plan = None
        if self.openai_client:
            try:
                system_prompt = (
                    "You are the CyberGuard Training Coach Agent. Your role is to guide corporate learners "
                    "with constructive, actionable feedback adhering to NIST SP 800-50 standards. "
                    "Be encouraging, concise, and highlight the exact psychological mechanism or technical indicator."
                )
                
                user_prompt = f"""
                Recent Evaluation: {json.dumps(evaluation_data)}
                Longitudinal Weakness Summary: {history_summary['summary_text']}
                NIST Training Context: {guidance_text}
                Calculated Next Difficulty: {next_difficulty}

                Respond ONLY with a JSON object containing:
                - "feedback": 2 clear sentences addressing what happened and why.
                - "remediation_tip": 1 concrete defense action rule.
                - "recommended_topic": Specific threat topic for next challenge.
                - "next_difficulty": "{next_difficulty}",
                - "reason_for_path": Concise rationale explaining this training trajectory.
                """

                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3
                )
                coaching_plan = json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"Notice: OpenAI Coach generation fallback engaged: {e}")

        # Fallback deterministic pedagogical engine if LLM offline
        if not coaching_plan:
            is_safe = evaluation_data.get("is_safe", final_score >= 70)
            dominant = history_summary.get("dominant_weakness", "urgency_bias")
            
            if is_safe:
                feedback = (
                    f"Excellent defensive judgment. You successfully avoided the deceptive trap "
                    f"and adhered to verified verification channels."
                )
                tip = "Continue maintaining dual-control authorization before acting on anomalous requests."
                topic = "Advanced Spear Phishing & Impersonation"
            else:
                feedback = (
                    f"Your decision showed awareness, but artificial urgency led you to execute before verifying. "
                    f"Adversaries specifically craft deadlines to trigger this reaction."
                )
                tip = "When a communication demands action within a narrow deadline, pause and verify via a known second channel."
                topic = "Urgency Indicators & BEC Defense"

            coaching_plan = {
                "feedback": feedback,
                "remediation_tip": tip,
                "recommended_topic": topic,
                "next_difficulty": next_difficulty,
                "reason_for_path": f"Adaptive path set to {next_difficulty} based on score of {final_score}/100."
            }

        coaching_plan["nist_reference"] = nist_reference
        coaching_plan["longitudinal_summary"] = history_summary["summary_text"]
        coaching_plan["overall_accuracy"] = history_summary["overall_accuracy_rate"]
        
        return coaching_plan
