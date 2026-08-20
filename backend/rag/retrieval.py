def get_org_context(user_role: str) -> str:
    # Mock retrieval logic
    # In production, this would query Supabase pgvector using the user's role
    if user_role.lower() == "finance manager":
        return "NovaTech Wire Transfer Policy: All transfers over $10,000 require secondary approval from the CFO."
    return "Standard company security policies apply."
