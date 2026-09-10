"""
Intelligent Policy Extraction & Structuring Engine (CyberGuard AI)

Solves the Arbitrary Document Ingestion Problem:
Real clients upload messy documents (PDF handbooks, numbered legal clauses,
bulleted lists, wiki dumps, or unformatted text) with varying layouts, disclaimers,
and noise.

Two-Tier Architecture:
- Tier 1 (Cloud Primary): LLM Semantic Extractor (gpt-4o-mini with structured JSON)
  Filters out disclaimers, intros, and footers. Extracts atomic, self-contained
  operational security rules with rich metadata.
- Tier 2 (Offline Fallback): Heuristic Multi-Pattern Parser
  Regex boundary detector for numbered hierarchies (1.1, Section IV), bullet points,
  and markdown headers. Zero external API dependency.
"""

import os
import re
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Common boilerplate patterns to filter out
BOILERPLATE_PATTERNS = [
    r'^(?:confidential|strictly confidential|internal use only|proprietary).*$',
    r'^page\s+\d+.*$',
    r'^(?:table of contents|contents|revision history|version control).*$',
    r'^all rights reserved(?:\s+\d{4})?.*$',
    r'^(?:document title|document id|author|approved by):.*$',
    r'^(?:copyright|\(c\)|©)\s*\d{4}.*$',
]


def clean_raw_text(text: str) -> str:
    """Normalize whitespace and strip common page/document header noise."""
    lines = text.splitlines()
    cleaned_lines = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # Check against boilerplate regex
        is_boilerplate = any(re.match(p, stripped, re.IGNORECASE) for p in BOILERPLATE_PATTERNS)
        if not is_boilerplate:
            cleaned_lines.append(stripped)
            
    return "\n".join(cleaned_lines)


def extract_with_llm(raw_text: str, company_name: str = "Organization", department: str = "General") -> List[Dict[str, Any]]:
    """
    Tier 1: LLM-Assisted Semantic Rule Extractor using gpt-4o-mini with JSON mode.
    Discards non-actionable boilerplate and outputs discrete atomic policy objects.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set.")

    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    system_prompt = f"""You are an enterprise cybersecurity policy parsing engine.
Your task is to analyze the provided raw document from '{company_name}' (Target Department: '{department}') and extract EVERY discrete, actionable security policy, Standard Operating Procedure (SOP), or compliance rule.

EXTRACTION DIRECTIVES:
1. Ignore introductory pleasantries, mission statements, tables of contents, document revision histories, and legal copyright disclaimers.
2. Extract each operational rule as an independent, self-contained atomic unit.
3. If a rule has conditions, monetary thresholds, or specific out-of-band verification steps, preserve them intact in 'full_text'.
4. Normalize and produce:
   - "rule_code": An identifiable code (e.g., TCG-FIN-01, IT-SEC-03, or synthesize one like {company_name[:3].upper()}-{department[:3].upper()}-01 if absent).
   - "title": Concise, professional descriptive title (e.g. "Dual-Approval for Outgoing Wire Transfers").
   - "department": The department the rule governs (e.g., Finance, IT, HR, Executive, or All).
   - "enforcement_level": "MANDATORY" | "RECOMMENDED" | "ADVISORY".
   - "rule_summary": A crisp 1-2 sentence core requirement.
   - "full_text": The complete, unabridged policy text including all thresholds, conditions, and procedures.
   - "trigger_keywords": An array of 3-5 operational keywords (e.g., ["wire transfer", "vendor invoice", "dual approval"]).

Output MUST be a valid JSON object matching this exact schema:
{{
  "rules": [
    {{
      "rule_code": "string",
      "title": "string",
      "department": "string",
      "enforcement_level": "string",
      "rule_summary": "string",
      "full_text": "string",
      "trigger_keywords": ["string"]
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Document Text:\n\n{raw_text}"}
        ],
        temperature=0.1
    )

    content = response.choices[0].message.content
    parsed = json.loads(content)
    rules = parsed.get("rules", [])
    return rules


def extract_with_heuristics(raw_text: str, company_name: str = "Organization", department: str = "General") -> List[Dict[str, Any]]:
    """
    Tier 2: Heuristic Multi-Pattern Fallback Parser (100% Offline / Zero-Cost).
    Uses regex boundary detection to cleanly isolate rules from bullets, numbered clauses,
    and section headers without external API calls.
    """
    cleaned = clean_raw_text(raw_text)
    lines = cleaned.splitlines()
    
    # Boundary patterns that signal the start of a new rule
    rule_boundary_regex = re.compile(
        r'^(?:'
        r'\[?[A-Z]{2,6}-[A-Z0-9]{2,6}-\d{1,4}\]?'  # Code like TCG-FIN-01 or [TCG-FIN-01]
        r'|(?:\d+\.|\d+\.\d+|\d+\.\d+\.\d+)\s+'    # Numbered like 1., 1.1, 1.1.2
        r'|(?:Section|Article|Policy|SOP|Rule)\s+\d+[:\.]?' # Section 1, Rule 2:
        r'|[•\-\*\>]\s+'                            # Bullets: •, -, *, >
        r'|\*\*[^*]+\*\*'                           # Bold header like **Rule Name:**
        r')',
        re.IGNORECASE
    )

    items = []
    current_item = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if rule_boundary_regex.match(stripped):
            if current_item:
                items.append("\n".join(current_item))
                current_item = []
            current_item.append(stripped)
        else:
            if current_item:
                current_item.append(stripped)
            else:
                current_item.append(stripped)

    if current_item:
        items.append("\n".join(current_item))

    # Convert extracted items into standardized rule dictionaries
    rules = []
    rule_idx = 1
    comp_prefix = re.sub(r'[^A-Za-z]', '', company_name)[:3].upper() or "ORG"
    dept_prefix = re.sub(r'[^A-Za-z]', '', department)[:3].upper() or "GEN"

    for item in items:
        text_content = item.strip()
        if len(text_content.split()) < 5:
            # Skip fragments or isolated headers
            continue

        # Detect or synthesize rule code
        code_match = re.search(r'\[?([A-Z]{2,6}-[A-Z0-9]{2,6}-\d{1,4})\]?', text_content)
        if code_match:
            rule_code = code_match.group(1)
        else:
            rule_code = f"{comp_prefix}-{dept_prefix}-{rule_idx:02d}"

        # Clean title from first line
        first_line = text_content.splitlines()[0]
        cleaned_first = re.sub(r'^[•\-\*\>\d\.\:\s]+', '', first_line).strip()
        cleaned_first = re.sub(r'\*\*', '', cleaned_first).strip()
        
        # Determine title
        if ":" in cleaned_first:
            title_candidate = cleaned_first.split(":", 1)[0].strip()
        elif "-" in cleaned_first and len(cleaned_first.split("-", 1)[0].split()) <= 6:
            title_candidate = cleaned_first.split("-", 1)[0].strip()
        else:
            words = cleaned_first.split()
            title_candidate = " ".join(words[:6])

        # Remove rule code from title if present
        title = re.sub(r'^[A-Z]{2,6}-[A-Z0-9]{2,6}-\d{1,4}\s*[:\-]?\s*', '', title_candidate).strip()
        if not title:
            title = f"{department} Policy Rule {rule_idx}"

        # Extract trigger keywords
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text_content.lower())
        stop_words = {"must", "shall", "with", "from", "that", "this", "will", "have", "policy", "rule", "company"}
        unique_keywords = [w for w in words if w not in stop_words][:5]

        # Determine summary
        sentences = re.split(r'(?<=[.!?])\s+', text_content)
        summary = sentences[0].strip() if sentences else text_content[:150]

        rules.append({
            "rule_code": rule_code,
            "title": title[:70],
            "department": department,
            "enforcement_level": "MANDATORY" if any(w in text_content.lower() for w in ["must", "required", "prohibited", "strictly", "never"]) else "RECOMMENDED",
            "rule_summary": summary,
            "full_text": text_content,
            "trigger_keywords": unique_keywords
        })
        rule_idx += 1

    return rules


def extract_policy_rules(
    raw_text: str,
    company_name: str = "Organization",
    department: str = "General",
    use_llm: bool = True
) -> List[Dict[str, Any]]:
    """
    Main entry point for intelligent policy extraction.
    Attempts Tier 1 LLM extraction; automatically falls back to Tier 2 heuristic parser
    if offline, API key missing, or on any parsing exception.
    """
    if not raw_text or not raw_text.strip():
        return []

    # 1. Attempt Tier 1 LLM Extraction if enabled and configured
    if use_llm and os.environ.get("OPENAI_API_KEY"):
        try:
            rules = extract_with_llm(raw_text, company_name=company_name, department=department)
            if rules and len(rules) > 0:
                return rules
        except Exception as e:
            print(f"Notice: Tier 1 LLM policy extraction failed or offline ({e}). Falling back to Tier 2 Heuristics.")

    # 2. Fallback to Tier 2 Heuristic Multi-Pattern Parser
    return extract_with_heuristics(raw_text, company_name=company_name, department=department)


def format_rule_for_embedding(rule: Dict[str, Any], company_name: str = "Organization") -> str:
    """Formats a structured policy rule into high-signal text for vector embedding."""
    rule_code = rule.get("rule_code", "POLICY")
    title = rule.get("title", "")
    department = rule.get("department", "General")
    summary = rule.get("rule_summary", "")
    full_text = rule.get("full_text", "")
    keywords = ", ".join(rule.get("trigger_keywords", []))

    return (
        f"[{company_name.upper()} {department.upper()} POLICY - {rule_code}] "
        f"{title}: {summary}. "
        f"Full Text & Requirements: {full_text} "
        f"Keywords: {keywords}"
    ).strip()
