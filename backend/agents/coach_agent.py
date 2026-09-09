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
