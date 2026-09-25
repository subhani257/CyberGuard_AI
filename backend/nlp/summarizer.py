import re
from typing import List, Dict, Any, Optional

class WeaknessSummarizer:
    """
    Member 3 NLP Component: Longitudinal Text Summarization.
    
    Synthesizes a user's multi-scenario decision history into an executive cognitive profile
    and vulnerability summary. Distinct from Member 2's single-decision classification.
    """

    def __init__(self):
        self.bias_definitions = {
            "urgency_bias": {
                "label": "Urgency Vulnerability",
                "indicators": ["urgency", "immediate", "asap", "deadline", "fast", "rush"],
                "summary": "is prone to succumbing to urgency and bypassing standard verification under artificial time pressure"
            },
            "authority_bias": {
                "label": "Executive Authority Bias",
                "indicators": ["ceo", "manager", "boss", "supervisor", "director", "cfo"],
                "summary": "exhibits deference to hierarchical authority, executing requests without second-party confirmation"
            },
            "sender_verification": {
                "label": "Domain Omission",
                "indicators": ["spoof", "domain", "address", "sender", "header"],
                "summary": "overlooks anomalous sender email headers and look-alike domains"
            },
            "financial_request": {
                "label": "Wire & Payment Exposure",
                "indicators": ["invoice", "wire", "transfer", "bank", "routing", "payment"],
                "summary": "requires reinforcement on institutional dual-control policies for accounts payable"
            }
        }

    def summarize_user_tendencies(self, decisions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Synthesize historical decisions into a cohesive psychological summary and statistics.
        
        Args:
            decisions: List of historical evaluation dictionaries from public.decisions.
            
        Returns:
            Dictionary containing prose summary, detected patterns, and threat accuracy stats.
        """
        if not decisions:
            return {
                "summary_text": "New learner profile. Baseline evaluation in progress with foundational scenarios.",
                "dominant_weakness": "baseline_assessment",
                "patterns_identified": [],
                "total_scenarios_analyzed": 0,
                "overall_accuracy_rate": 100
            }

        total_scenarios = len(decisions)
        unsafe_count = 0
        weakness_frequencies: Dict[str, int] = {}
        reasoning_corpus = []

        for d in decisions:
            is_safe = d.get("is_safe", True)
            if not is_safe:
                unsafe_count += 1
            
            # Extract reasoning and evaluation text
            reasoning = d.get("reasoning", "")
            if reasoning:
                reasoning_corpus.append(reasoning.lower())

            # Aggregate reported weaknesses from evaluation JSON
            eval_data = d.get("evaluation", {})
            if isinstance(eval_data, dict):
                weaknesses = eval_data.get("weaknesses", [])
                threat_indicators = eval_data.get("threat_indicators", [])
                
                for w in weaknesses:
                    weakness_frequencies[w] = weakness_frequencies.get(w, 0) + 1
                for t in threat_indicators:
                    weakness_frequencies[t] = weakness_frequencies.get(t, 0) + 1

        # Analyze text corpus for implicit psychological indicators
        combined_reasoning = " ".join(reasoning_corpus)
        for bias_key, bias_info in self.bias_definitions.items():
            count = sum(len(re.findall(r'\b' + ind + r'\b', combined_reasoning)) for ind in bias_info["indicators"])
            if count > 0:
                weakness_frequencies[bias_key] = weakness_frequencies.get(bias_key, 0) + count

        # Sort frequencies
        sorted_weaknesses = sorted(weakness_frequencies.items(), key=lambda x: x[1], reverse=True)
        dominant_weakness = sorted_weaknesses[0][0] if sorted_weaknesses else "urgency_bias"
        
        # Build natural-language longitudinal prose summary
        patterns = []
        for w, freq in sorted_weaknesses[:3]:
            bias_info = self.bias_definitions.get(w)
            if bias_info:
                patterns.append(f"{bias_info['label']} (observed in {freq} instances)")
            else:
                patterns.append(f"{w.replace('_', ' ').capitalize()} ({freq} occurrences)")

        accuracy_rate = int(((total_scenarios - unsafe_count) / total_scenarios) * 100)

        # Synthesize executive summary
        summary_sentences = []
        if unsafe_count == 0:
            summary_sentences.append(f"Across {total_scenarios} simulated engagements, the learner consistently demonstrates solid threat identification.")
        else:
            summary_sentences.append(f"Analysis of {total_scenarios} past engagements indicates recurring susceptibility where the learner {self.bias_definitions.get(dominant_weakness, {}).get('summary', 'exhibits situational hesitation')}.")

        if len(sorted_weaknesses) > 1:
            second_weakness = sorted_weaknesses[1][0]
            summary_sentences.append(f"Secondary behavioral vulnerability noted in {second_weakness.replace('_', ' ')} scenarios.")
            
        summary_text = " ".join(summary_sentences)

        return {
            "summary_text": summary_text,
            "dominant_weakness": dominant_weakness,
            "patterns_identified": patterns,
            "total_scenarios_analyzed": total_scenarios,
            "overall_accuracy_rate": accuracy_rate
        }
