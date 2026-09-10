import re
from typing import Dict, List, Any
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    try:
        nlp = spacy.blank("en")
    except Exception:
        nlp = None

# Regex patterns for high-sensitivity PII
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_REGEX = re.compile(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}')
FINANCIAL_REGEX = re.compile(r'\$\s?\d+(?:,\d{3})*(?:\.\d{2})?|\b(?:account|acct|routing)\s*#?\s*\d{6,12}\b', re.IGNORECASE)


def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract named entities from text using spaCy NER.
    """
    entities = {
        "persons": [],
        "organizations": [],
        "locations": [],
        "emails": EMAIL_REGEX.findall(text),
        "financials": FINANCIAL_REGEX.findall(text)
    }

    if not nlp:
        return entities

    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "PERSON" and ent.text not in entities["persons"]:
            entities["persons"].append(ent.text)
        elif ent.label_ == "ORG" and ent.text not in entities["organizations"]:
            entities["organizations"].append(ent.text)
        elif ent.label_ in ("GPE", "LOC") and ent.text not in entities["locations"]:
            entities["locations"].append(ent.text)

    return entities


def sanitize_input(text: str) -> str:
    """
    Member 1 Responsible AI / Privacy Sanitizer:
    Strips raw employee PII (names, corporate emails, phone numbers, and financial details)
    prior to submitting organizational data or prompts to external LLMs.
    """
    if not text:
        return ""

    sanitized = text

    # 1. Mask concrete pattern matches (emails, phones, financial amounts)
    sanitized = EMAIL_REGEX.sub("[MASKED_EMAIL]", sanitized)
    sanitized = PHONE_REGEX.sub("[MASKED_PHONE]", sanitized)
    sanitized = FINANCIAL_REGEX.sub("[MASKED_FINANCIAL]", sanitized)

    # 2. Mask Named Entities via spaCy if loaded
    if nlp:
        try:
            doc = nlp(sanitized)
            # Replace entities in reverse offset order to prevent indexing shift
            ents_sorted = sorted(doc.ents, key=lambda e: e.start_char, reverse=True)
            for ent in ents_sorted:
                if ent.label_ == "PERSON":
                    sanitized = sanitized[:ent.start_char] + "[MASKED_NAME]" + sanitized[ent.end_char:]
                elif ent.label_ == "ORG" and "NovaTech" not in ent.text:
                    sanitized = sanitized[:ent.start_char] + "[MASKED_ORG]" + sanitized[ent.end_char:]
        except Exception as e:
            print(f"Notice: spaCy entity replacement skipped: {e}")

    return sanitized
