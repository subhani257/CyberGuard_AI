"""
CyberGuard AI — Training Coach Node
Wraps TrainingCoachAgent but routes the LLM call through LangChain ChatOpenAI
for LangSmith tracing of coaching feedback generation.
"""
import json
import os
import time
from typing import Any, Dict, List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from graph.state import CyberGuardState
from agents.coach_agent import TrainingCoachAgent

_coach_agent = TrainingCoachAgent()


def _get_llm() -> Optional[ChatOpenAI]:
    """Instantiate ChatOpenAI lazily, inheriting LangSmith tracing if configured."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or api_key.startswith("sk-proj-placeholder"):
        return None
    try:
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.3,
            openai_api_key=api_key,
            tags=["coach_agent"],
        )
    except Exception:
        return None


FOCUS_LABELS = {
    "urgency_bias": "Urgency and Time Pressure",
    "authority_bias": "Authority Impersonation",
    "sender_verification": "Sender Identity Verification",
    "link_verification": "Suspicious Link Verification",
    "payment_verification": "Payment Request Verification",
    "attachment_safety": "Attachment Safety",
    "security_reasoning": "Recognising Threat Indicators",
    "verification_behavior": "Independent Verification",
}


def coach_node(state: CyberGuardState) -> Dict[str, Any]:
    """
    LangGraph node: generates adaptive coaching feedback from evaluation results.
    Reads:  evaluation_result, past_decisions, current_difficulty
    Writes: coaching_result, agent_trace
    """
    start = time.perf_counter()
    trace = list(state.get("agent_trace", []))
    evaluation_data = state.get("evaluation_result", {})
    past_decisions = state.get("past_decisions", [])
    current_difficulty = state.get("current_difficulty", "beginner")

    # Reuse all pure-Python logic from the existing TrainingCoachAgent
    final_score = evaluation_data.get("final_score", 50)
    weaknesses: List[str] = evaluation_data.get("weaknesses") or []
    raw_indicators = evaluation_data.get("threat_indicators") or []
    if isinstance(raw_indicators, dict):
        threat_indicators = [n for n, s in raw_indicators.items() if s]
    elif isinstance(raw_indicators, list):
        threat_indicators = [str(i) for i in raw_indicators]
    else:
        threat_indicators = []

    all_weakness_keys = list(weaknesses) + threat_indicators or ["urgency_bias"]

    # RAG retrieval (pgvector — unchanged)
    retrieved_training = _coach_agent.retriever.retrieve_guidance(all_weakness_keys, top_k=2)
    guidance_text = " ".join(m.get("content", "") for m in retrieved_training)
    nist_reference = (
        retrieved_training[0].get("source", "NIST SP 800-50") if retrieved_training else "NIST SP 800-50"
    )

    # NLP weakness summarization (unchanged)
    history_summary = _coach_agent.summarizer.summarize_user_tendencies(past_decisions)

    # Adaptive difficulty algorithm (unchanged)
    recent_scores = [
        d.get("evaluation", {}).get("final_score", 50) for d in past_decisions[:4]
    ]
    recent_scores.append(final_score)
    next_difficulty = _coach_agent.calculate_next_difficulty(current_difficulty, recent_scores)

    # LLM coaching generation via LangChain (LangSmith traces this automatically)
    system_prompt = (
        "You are the CyberGuard Training Coach Agent. Your role is to guide corporate learners "
        "with constructive, actionable feedback adhering to NIST SP 800-50 standards. "
        "Be encouraging, concise, and highlight the exact psychological mechanism or technical indicator."
    )
    user_prompt = f"""
Recent Evaluation: {json.dumps(evaluation_data)}
Longitudinal Weakness Summary: {history_summary.get("summary_text", "")}
NIST Training Context: {guidance_text}
Calculated Next Difficulty: {next_difficulty}

Respond ONLY with a JSON object containing:
- "feedback": 2 clear sentences addressing what happened and why.
- "remediation_tip": 1 concrete defense action rule.
- "recommended_topic": Specific threat topic for next challenge.
- "next_difficulty": "{next_difficulty}"
- "reason_for_path": Concise rationale explaining this training trajectory.
"""

    coaching_plan = None
    llm = _get_llm()
    llm_output = None
    llm_used = False
    if llm:
        try:
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ])
            llm_output = response.content
            coaching_plan = json.loads(response.content)
            llm_used = True
        except Exception as e:
            print(f"[coach_node] LLM coaching failed, using deterministic fallback: {e}")


    # Deterministic fallback (identical to original TrainingCoachAgent fallback)
    if not coaching_plan:
        is_safe = evaluation_data.get("is_safe", final_score >= 70)
        focus = weaknesses[0] if weaknesses else (threat_indicators[0] if threat_indicators else "verification_behavior")
        topic = FOCUS_LABELS.get(focus, focus.replace("_", " ").title())
        if is_safe:
            feedback = "Excellent defensive judgment. You successfully avoided the deceptive trap."
            tip = "Continue maintaining dual-control authorisation before acting on anomalous requests."
            topic = f"Advanced {topic}"
        else:
            feedback = (
                "Your decision showed awareness, but artificial urgency led you to execute before verifying. "
                "Adversaries specifically craft deadlines to trigger this reaction."
            )
            tip = "When a communication demands action within a narrow deadline, pause and verify via a known second channel."
        coaching_plan = {
            "feedback": feedback,
            "remediation_tip": tip,
            "recommended_topic": topic,
            "next_difficulty": next_difficulty,
            "reason_for_path": f"Adaptive path set to {next_difficulty} based on score of {final_score}/100.",
        }

    # Ensure algorithm is authoritative for difficulty
    coaching_plan["next_difficulty"] = next_difficulty
    coaching_plan.setdefault(
        "recommended_topic",
        weaknesses[0].replace("_", " ").title() if weaknesses else "Independent Verification",
    )
    coaching_plan["nist_reference"] = nist_reference
    coaching_plan["longitudinal_summary"] = history_summary.get("summary_text", "")
    coaching_plan["overall_accuracy"] = history_summary.get("overall_accuracy_rate", 0)

    elapsed = round(time.perf_counter() - start, 3)
    trace.append({
        "node": "coach_node",
        "latency_s": elapsed,
        "next_difficulty": next_difficulty,
        "nist_reference": nist_reference,
        "retrieval_input": all_weakness_keys,
        "retrieval_output": retrieved_training,
        "history_summary": history_summary,
        "execution_mode": "llm" if llm_used else "deterministic_fallback",
        "model_version": "gpt-4o-mini" if llm_used else None,
        "llm_input": {"system": system_prompt, "user": user_prompt} if llm else None,
        "llm_output": llm_output,
    })

    return {
        "coaching_result": coaching_plan,
        "agent_trace": trace,
    }
