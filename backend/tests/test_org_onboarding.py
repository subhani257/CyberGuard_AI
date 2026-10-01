import io
import pytest
from fastapi.testclient import TestClient
import pypdf

from main import app
from rag.retrieval import get_org_context
from api.org_routes import CUSTOM_ORG_POLICIES_CACHE

client = TestClient(app)


def test_auth_signup():
    """Test user signup route."""
    payload = {
        "email": "test_onboard_user@apexfinancial.com",
        "password": "Password123!",
        "full_name": "Apex Test User",
        "company": "Apex Financial",
        "role": "Compliance Analyst"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == "test_onboard_user@apexfinancial.com"
    assert data["user"]["company"] == "Apex Financial"


def test_auth_google():
    """Test Google OAuth login route."""
    payload = {
        "email": "alex.turner@techcorp.io",
        "full_name": "Alex Turner"
    }
    response = client.post("/api/auth/google", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == "alex.turner@techcorp.io"


def test_onboard_policy_text_submission(apex_headers):
    """Test onboarding organizational policy via direct text submission."""
    form_data = {
        "user_id": "test-user-uuid-12345",
        "company_name": "Apex Financial",
        "department": "Finance",
        "role_title": "Wire Transfer Specialist",
        "role_description": "Handles international client transfers.",
        "policy_text": (
            "APEX-FIN-01: Every outgoing wire transfer over $20,000 must be authorized with dual "
            "digital signatures and confirmed via an authenticated phone call to the client's verified number. "
            "APEX-FIN-02: Urgent wire requests arriving from free email providers (such as Gmail, Yahoo, or Outlook) "
            "must be immediately rejected and reported to the fraud prevention desk."
        )
    }
    response = client.post("/api/org/onboard-policy", data=form_data, headers=apex_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["organization"] == "Apex Financial"
    assert data["chunks_ingested"] >= 1


def test_onboard_policy_pdf_upload(apex_headers):
    """Test onboarding policy via in-memory PDF document upload using pypdf."""
    # Create an in-memory test PDF
    pdf_writer = pypdf.PdfWriter()
    pdf_writer.add_blank_page(width=72, height=72)
    pdf_bytes = io.BytesIO()
    pdf_writer.write(pdf_bytes)
    pdf_bytes.seek(0)

    files = {
        "file": ("corporate_policy.pdf", pdf_bytes, "application/pdf")
    }
    form_data = {
        "user_id": "test-user-pdf-99999",
        "company_name": "Apex Financial",
        "department": "Finance",
        "role_title": "Controller",
        "role_description": "Oversees corporate accounting.",
        "policy_text": "APEX-SEC-99: Backup policy for internal audit controls."
    }

    response = client.post("/api/org/onboard-policy", data=form_data, files=files, headers=apex_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["source"] == "corporate_policy.pdf"
    assert data["chunks_ingested"] >= 1


def test_scenario_generation_with_company_context():
    """Test that scenario generation accepts company context and retrieves relevant policy."""
    context = get_org_context(
        user_role="Wire Transfer Specialist",
        company_name="Apex Financial",
        user_id="test-user-uuid-12345"
    )
    assert "Apex Financial" in context or "APEX" in context or "wire" in context.lower()


def test_get_custom_policies_and_default_fallback(apex_headers):
    """Test retrieving structured policies with default fallback and custom rules."""
    # Test retrieving custom policies for Apex Financial
    res = client.get("/api/org/policies/Apex%20Financial", headers=apex_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "rules" in data
    assert len(data["rules"]) >= 1
    first_rule = data["rules"][0]
    assert "rule_code" in first_rule
    assert "title" in first_rule
    assert "enforcement_level" in first_rule

    # Test fallback to default organizational baseline for an unknown org
    res_default = client.get("/api/org/policies/UnknownCorp")
    assert res_default.status_code == 200
    default_data = res_default.json()
    assert default_data["success"] is True
    assert default_data["count"] >= 5
    assert any("FIN" in r["rule_code"] or "SEC" in r["rule_code"] for r in default_data["rules"])


def test_delete_custom_policy_rule(apex_headers):
    """Test deleting an organization policy rule by rule_code."""
    delete_res = client.delete("/api/org/policies/APEX-FIN-01", headers=apex_headers)
    assert delete_res.status_code == 200
    assert delete_res.json()["success"] is True


def test_update_user_profile(apex_headers):
    """Test updating user profile attributes via PUT /api/auth/profile."""
    payload = {
        "full_name": "Alexander Turner",
        "role": "Chief Financial Officer",
        "company": "TechCorp Global",
        "department": "Finance & Treasury"
    }
    res = client.put("/api/auth/profile", json=payload, headers=apex_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["user"]["full_name"] == "Alexander Turner"
    assert data["user"]["role"] == "Chief Financial Officer"
    assert data["user"]["company"] == "TechCorp Global"
    assert "access_token" in data

