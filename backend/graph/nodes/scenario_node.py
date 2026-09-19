"""
CyberGuard AI — Scenario Generation Node
Wraps the existing ScenarioAgent but calls the LLM through LangChain ChatOpenAI
so that LangSmith auto-traces every prompt, response, latency, and token cost.
"""
import json
import os
import time
from typing import Any, Dict, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from agents.scenario_agent import ScenarioAgent
from graph.state import CyberGuardState


# Reuse the singleton for fallback logic (channel templates etc.)
_agent = ScenarioAgent()


def _get_llm() -> Optional[ChatOpenAI]:
    """Instantiate ChatOpenAI lazily, inheriting LangSmith tracing if configured."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or api_key.startswith("sk-proj-placeholder"):
        return None
    try:
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=api_key,
            tags=["scenario_agent"],
        )
    except Exception:
        return None


def scenario_node(state: CyberGuardState) -> Dict[str, Any]:
    """
    LangGraph node: generates a phishing scenario for the given user context.
    Reads:  role, difficulty, org_context, channel, topic
    Writes: scenario, agent_trace
    """
    start = time.perf_counter()
    role = state.get("role", "Corporate Employee")
    difficulty = state.get("difficulty", "beginner")
    org_context = state.get("org_context", "")
    channel = state.get("channel")
    topic = state.get("topic")
    trace = list(state.get("agent_trace", []))

    # Build channel-specific instruction block (reused from ScenarioAgent)
    channel_block = ""
    if channel and channel in _agent.CHANNEL_INSTRUCTIONS:
        channel_block = (
            f"\nATTACK CHANNEL CONSTRAINT (MANDATORY):\n"
            f"The scenario MUST use this specific attack channel: {channel.upper().replace('_', ' ')}\n"
            f"{_agent.CHANNEL_INSTRUCTIONS[channel]}\n"
        )

    system_msg = "You are a professional cybersecurity scenario generation AI. Output JSON only."
    user_msg = f"""
You are the Scenario Generation Agent in Midnight Intelligence, an adaptive cybersecurity training simulator.
Your objective is to generate an authentic, realistic cybersecurity situation for an employee.

LEARNER PROFILE:
- Target Role: {role}
- Training Difficulty: {difficulty}
- Recommended Training Focus: {topic or "Role-appropriate cybersecurity awareness"}

ORGANIZATIONAL CONTEXT (NovaTech Corporate Policies):
{org_context}
{channel_block}
RULES & RESPONSIBLE AI SAFETY:
1. Ground the lure in the employee's role and corporate workflows.
2. Embed subtle but identifiable indicators (spoofed domains, artificial urgency, channel avoidance).
3. DO NOT output real executable malware or active malicious URLs. Use benign simulated addresses.
4. Provide exactly 4 diverse action choices ranging from unsafe/reflexive to proactive verification.

OUTPUT SPECIFICATION:
Output strictly valid JSON with these exact keys:
{{
  "situation_title": "A short dramatic title",
  "situation_tagline": "A one-sentence reflection clue",
  "sender_name": "Full name of sender",
  "sender_email": "Realistic email address or channel identifier",
  "subject": "Message subject or call topic",
  "body": "The primary message narrative",
  "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
  "threat_type": "Specific attack category",
  "difficulty": "{difficulty}",
  "clues_embedded": ["Clue 1", "Clue 2", "Clue 3"],
  "channel": "{channel or 'email'}"
}}
"""

    scenario = None
    effective_channel = channel or "email"
    llm_output = None
    llm_used = False

    llm = _get_llm()
    if llm:
        try:
            response = llm.invoke([
                SystemMessage(content=system_msg),
                HumanMessage(content=user_msg),
            ])
            raw = response.content
            llm_output = raw
            parsed = json.loads(raw)
            parsed["channel"] = effective_channel
            parsed["channel_data"] = _agent._enrich_channel_data(parsed, effective_channel, role)
            scenario = parsed
            llm_used = True
        except Exception as e:
            print(f"[scenario_node] LLM call failed, using fallback: {e}")
            scenario = _agent._get_channel_fallback(effective_channel, role, difficulty)
    else:
        scenario = _agent._get_channel_fallback(effective_channel, role, difficulty)

    elapsed = round(time.perf_counter() - start, 3)
    trace.append({
        "node": "scenario_node",
        "latency_s": elapsed,
        "channel": effective_channel,
        "difficulty": difficulty,
        "execution_mode": "llm" if llm_used else "deterministic_fallback",
        "model_version": "gpt-4o-mini" if llm_used else None,
        "llm_input": {"system": system_msg, "user": user_msg} if llm else None,
        "llm_output": llm_output,
    })

    return {
        "scenario": scenario,
        "agent_trace": trace,
    }
