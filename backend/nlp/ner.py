import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # If not installed, just mock it for now, or assume it will be installed
    nlp = None

def sanitize_input(text: str) -> str:
    if not nlp:
        # Fallback if model isn't loaded
        return text
    
    doc = nlp(text)
    sanitized_text = text
    # Simple replace logic - in a real scenario we'd do a more robust offset-based replace
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            sanitized_text = sanitized_text.replace(ent.text, "[MASKED_NAME]")
        elif ent.label_ == "ORG":
            sanitized_text = sanitized_text.replace(ent.text, "[MASKED_ORG]")
        # Add more entity types as needed
            
    return sanitized_text
