import os
import sys
from pathlib import Path

os.environ.setdefault("JWT_SECRET", "cyberguard-test-secret-key-at-least-32-characters")
os.environ.setdefault("CYBERGUARD_DEMO_MODE", "true")
# Tests must never write to a configured live Supabase project or call a paid LLM.
os.environ["SUPABASE_URL"] = ""
os.environ["NEXT_PUBLIC_SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from security.auth_bearer import create_access_token


@pytest.fixture
def learner_headers():
    token = create_access_token({
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "nimal@novatech.com",
        "access_role": "learner",
        "role": "Finance Manager",
        "company": "NovaTech Solutions",
        "full_name": "Nimal Perera",
        "is_active": True,
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_learner_headers():
    token = create_access_token({
        "sub": "22222222-2222-2222-2222-222222222222",
        "email": "learner@novatech.com",
        "access_role": "learner",
        "role": "HR Officer",
        "company": "NovaTech Solutions",
        "full_name": "Jane Doe",
        "is_active": True,
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def apex_headers():
    token = create_access_token({
        "sub": "33333333-3333-3333-3333-333333333333",
        "email": "analyst@apexfinancial.com",
        "access_role": "learner",
        "role": "Compliance Analyst",
        "company": "Apex Financial",
        "full_name": "Apex Test User",
        "is_active": True,
    })
    return {"Authorization": f"Bearer {token}"}
