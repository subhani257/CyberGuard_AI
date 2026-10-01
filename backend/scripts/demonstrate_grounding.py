"""Offline viva demonstration of CyberGuard's grounding acceptance gate.

Run from ``backend`` with:
    python scripts/demonstrate_grounding.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from rag.grounding import normalize_evidence, validate_grounded_payload


def record(content: str):
    return {
        "content": content,
        "source": "CyberGuard Viva Demonstration KB",
        "metadata": {
            "record_id": "KB-DEMO-001",
            "source": "CyberGuard Viva Demonstration KB",
            "url": "https://example.invalid/cyberguard-viva-demo",
        },
    }


def candidate(statement: str):
    return {
        "answer": statement,
        "citations": ["KB-DEMO-001"],
        "evidence_quotes": [{"citation_id": "KB-DEMO-001", "quote": statement}],
    }


def check(name: str, payload, evidence, expected: bool):
    accepted, errors = validate_grounded_payload(payload, evidence)
    passed = accepted is expected
    print(f"[{'PASS' if passed else 'FAIL'}] {name}: accepted={accepted}")
    if errors:
        print("       " + "; ".join(errors))
    return passed


def main() -> int:
    original_fact = "Project BlueFalcon requires three independent approvals."
    changed_fact = "Project BlueFalcon requires four independent approvals."
    original_kb = normalize_evidence([record(original_fact)], "KB")
    changed_kb = normalize_evidence([record(changed_fact)], "KB")

    cases = [
        check("KB fact with valid citation and quote", candidate(original_fact), original_kb, True),
        check("Old answer after KB fact changes", candidate(original_fact), changed_kb, False),
        check("Updated answer after KB fact changes", candidate(changed_fact), changed_kb, True),
        check(
            "Hallucinated source id",
            {
                "answer": "The model remembers a different rule.",
                "citations": ["MODEL-999"],
                "evidence_quotes": [{"citation_id": "MODEL-999", "quote": "different rule"}],
            },
            changed_kb,
            False,
        ),
        check("No retrieved evidence", candidate(changed_fact), [], False),
    ]
    summary = {"passed": sum(cases), "total": len(cases), "all_passed": all(cases)}
    print(json.dumps(summary, indent=2))
    return 0 if all(cases) else 1


if __name__ == "__main__":
    raise SystemExit(main())
