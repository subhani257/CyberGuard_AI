"""
Unit and Integration Tests for the Intelligent Policy Extraction Engine (backend/rag/policy_extractor.py)
Validates rule extraction, boundary detection, metadata enrichment, and local HF vectorization
across diverse real-world messy client document formats.
"""

import pytest
try:
    from rag.policy_extractor import (
        extract_policy_rules,
        extract_with_heuristics,
        clean_raw_text,
        format_rule_for_embedding
    )
    from api.org_routes import get_local_embedding
except ImportError:
    from backend.rag.policy_extractor import (
        extract_policy_rules,
        extract_with_heuristics,
        clean_raw_text,
        format_rule_for_embedding
    )
    from backend.api.org_routes import get_local_embedding



SAMPLE_BULLETED_DOC = """CONFIDENTIAL — FOR INTERNAL USE ONLY
Employee Handbook v4.2 — Information Security Policy
Page 14 of 96. Copyright © 2026 Nexus Innovations.

Welcome to Nexus! Please follow these operational rules:
• External Media Prohibition: Employees are strictly prohibited from connecting unauthorized USB flash drives to laptops.
- Password Hygiene: Sharing corporate passwords via Slack or email is prohibited. Credentials must be stored in 1Password.
* Phishing Incident Reporting: Any suspicious email must be reported within 15 minutes to soc@nexus.com.

TABLE OF CONTENTS:
Section 1: General Info
"""

SAMPLE_LEGAL_DOC = """Apex Logistics Inc. — Standard Operating Procedures (SOP)
Approved by: Chief Information Security Officer

1.0 FINANCIAL DISBURSEMENTS
1.1 Dual-Control Execution: All ACH and SEPA transfers greater than €5,000 require dual authorization.
1.2 Out-of-Band Callback Verification: When an invoice reflects modified bank coordinates, staff must call verified contacts.
1.3 Executive Impersonation Defense: Any email from the CEO demanding urgent wire transactions must be reported immediately.
"""

SAMPLE_CASUAL_DUMP = """quick reminder to all accounting staff: 
first off wire transfers over 10k must always be approved by sarah or david over the phone before sending. 
secondly if a vendor emails saying their bank account details changed do not update without calling them. 
third, any urgent gift card requests from executives are phishing scams so report them to it-security."""


def test_clean_raw_text_strips_boilerplate():
    cleaned = clean_raw_text(SAMPLE_BULLETED_DOC)
    assert "CONFIDENTIAL" not in cleaned
    assert "Page 14 of 96" not in cleaned
    assert "External Media Prohibition" in cleaned


def test_extract_with_heuristics_bullets():
    rules = extract_with_heuristics(SAMPLE_BULLETED_DOC, company_name="Nexus", department="IT")
    assert len(rules) >= 3
    rule_codes = [r["rule_code"] for r in rules]
    assert any("NEX" in code for code in rule_codes)


def test_extract_with_heuristics_numbered_legal():
    rules = extract_with_heuristics(SAMPLE_LEGAL_DOC, company_name="Apex Logistics", department="Finance")
    assert len(rules) >= 3
    # Check that dual-control is present
    titles = [r["title"].lower() for r in rules]
    assert any("dual" in t for t in titles)


def test_format_rule_for_embedding():
    rule = {
        "rule_code": "TCG-FIN-01",
        "title": "Dual-Approval for Wire Transfers",
        "department": "Finance",
        "enforcement_level": "MANDATORY",
        "rule_summary": "Transfers over $10,000 require dual approval.",
        "full_text": "All outgoing wire transfers exceeding $10,000 must receive dual-authorization.",
        "trigger_keywords": ["wire transfer", "payment approval"]
    }
    formatted = format_rule_for_embedding(rule, company_name="TechCorp Global")
    assert "TECHCORP GLOBAL" in formatted
    assert "TCG-FIN-01" in formatted
    assert "Dual-Approval for Wire Transfers" in formatted


def test_local_huggingface_embedding_dimensions():
    sample_text = "[TECHCORP GLOBAL FINANCE POLICY - TCG-FIN-01] Dual-Approval for Outgoing Wire Transfers"
    vector = get_local_embedding(sample_text)
    assert len(vector) == 1536
    assert isinstance(vector[0], float)


def test_intelligent_extractor_end_to_end():
    rules = extract_policy_rules(
        raw_text=SAMPLE_CASUAL_DUMP,
        company_name="FastRetail",
        department="Accounting",
        use_llm=True
    )
    assert len(rules) >= 3
    for r in rules:
        assert "rule_code" in r
        assert "title" in r
        assert "enforcement_level" in r
        assert "rule_summary" in r
        assert len(r["trigger_keywords"]) > 0
