"""Shared evidence and citation controls for knowledge-grounded generation.

The LLM is still a pretrained model.  This module enforces an application-level
contract: factual prose is accepted only when it cites retrieved records and
includes exact quotes that can be checked locally without another model call.
"""
from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, Iterable, List, Mapping, Sequence, Tuple


Evidence = Dict[str, Any]


def _stable_id(prefix: str, content: str) -> str:
    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()[:10].upper()
    return f"{prefix}-{digest}"


def normalize_evidence(records: Iterable[Mapping[str, Any]], prefix: str) -> List[Evidence]:
    """Return a small, consistent evidence shape from pgvector or local records."""
    normalized: List[Evidence] = []
    seen = set()
    for record in records or []:
        metadata = record.get("metadata") or {}
        content = str(record.get("content") or "").strip()
        if not content:
            continue
        record_id = str(
            metadata.get("record_id")
            or metadata.get("policy_id")
            or record.get("record_id")
            or record.get("id")
            or _stable_id(prefix, content)
        ).strip()
        if not record_id or record_id in seen:
            continue
        seen.add(record_id)
        normalized.append({
            "record_id": record_id,
            "content": content,
            "source": str(record.get("source") or metadata.get("source") or "Unspecified source"),
            "source_url": str(metadata.get("url") or record.get("source_url") or ""),
            "similarity": record.get("similarity"),
        })
    return normalized


def evidence_from_context(context: str, prefix: str = "ORG") -> List[Evidence]:
    """Convert the existing ``[record-id] content`` context format to evidence."""
    evidence: List[Evidence] = []
    for raw_line in (context or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        match = re.match(r"^\[([^\]]+)\]\s*(.+)$", line)
        if match:
            record_id, content = match.group(1).strip(), match.group(2).strip()
        else:
            content = line
            record_id = _stable_id(prefix, content)
        evidence.append({
            "record_id": record_id,
            "content": content,
            "source": "Retrieved organizational context",
            "source_url": "",
            "similarity": None,
        })
    return normalize_evidence(evidence, prefix)


def render_evidence(evidence: Sequence[Mapping[str, Any]]) -> str:
    """Render evidence with explicit boundaries to reduce instruction injection."""
    blocks = []
    for item in evidence:
        blocks.append(
            f"[RECORD {item['record_id']}]\n"
            f"Source: {item.get('source') or 'Unspecified source'}\n"
            f"URL: {item.get('source_url') or 'not supplied'}\n"
            f"Content: {item['content']}"
        )
    return "\n\n".join(blocks)


def validate_grounded_payload(
    payload: Mapping[str, Any], evidence: Sequence[Mapping[str, Any]]
) -> Tuple[bool, List[str]]:
    """Validate record citations and verbatim evidence quotes without an LLM.

    Required response fields:
      * ``citations``: a non-empty list containing only retrieved record IDs.
      * ``evidence_quotes``: objects with ``citation_id`` and an exact substring
        from that record.  Every cited record must have a verified quote.
    """
    errors: List[str] = []
    by_id = {str(item["record_id"]): str(item["content"]) for item in evidence}
    citations = payload.get("citations")
    quotes = payload.get("evidence_quotes")

    if not isinstance(citations, list) or not citations:
        errors.append("citations must be a non-empty list")
        citations = []
    citations = [str(value) for value in citations]
    unknown = sorted(set(citations) - set(by_id))
    if unknown:
        errors.append(f"unknown citation ids: {', '.join(unknown)}")

    if not isinstance(quotes, list) or not quotes:
        errors.append("evidence_quotes must be a non-empty list")
        quotes = []

    verified_quote_ids = set()
    for index, quote_item in enumerate(quotes):
        if not isinstance(quote_item, Mapping):
            errors.append(f"evidence_quotes[{index}] must be an object")
            continue
        citation_id = str(quote_item.get("citation_id") or "")
        quote = str(quote_item.get("quote") or "").strip()
        if citation_id not in by_id:
            errors.append(f"evidence quote uses unknown citation id: {citation_id or '<empty>'}")
            continue
        if len(quote) < 8 or quote.casefold() not in by_id[citation_id].casefold():
            errors.append(f"quote for {citation_id} is not an exact evidence substring")
            continue
        verified_quote_ids.add(citation_id)

    missing_quotes = sorted(set(citations) - verified_quote_ids)
    if missing_quotes:
        errors.append(f"citations without verified quotes: {', '.join(missing_quotes)}")
    return not errors, errors


def grounding_metadata(
    evidence: Sequence[Mapping[str, Any]],
    citations: Sequence[str],
    *,
    status: str,
    validation_errors: Sequence[str] = (),
    scope: str = "factual guidance",
) -> Dict[str, Any]:
    """Create a UI/audit-friendly explanation of how an output was grounded."""
    cited = set(str(value) for value in citations)
    messages = {
        "grounded": "Citations and exact evidence quotes were validated against retrieved records.",
        "refused": "Factual AI prose was withheld because verified evidence was unavailable.",
        "simulation_template": "This is a pre-authored fictional simulation, not a knowledge-grounded factual answer.",
    }
    return {
        "status": status,
        "scope": scope,
        "citations": list(citations),
        "evidence": [dict(item) for item in evidence if str(item.get("record_id")) in cited],
        "validation_errors": list(validation_errors),
        "message": messages.get(
            status,
            "Generated factual prose was not accepted because verified evidence was unavailable or invalid.",
        ),
    }
