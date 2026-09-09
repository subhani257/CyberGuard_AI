import pytest
from fastapi.testclient import TestClient
from main import app
from security.auth_bearer import create_access_token

client = TestClient(app)

def test_architecture_endpoint_lists_all_members():
    response = client.get("/api/system/architecture")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "member_3" in data["modules"]
    assert "Adaptive Training Coach Agent & Auth/RBAC" in data["modules"]["member_3"]

def test_login_successful_learner():
    response = client.post("/api/auth/login", json={
        "email": "learner@novatech.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["access_role"] == "learner"
    assert data["user"]["email"] == "learner@novatech.com"

def test_login_invalid_credentials():
    response = client.post("/api/auth/login", json={
        "email": "learner@novatech.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_auth_me_with_valid_token():
    # Generate token
    token = create_access_token({
        "sub": "test-uuid-1234",
        "email": "test@example.com",
        "access_role": "learner",
        "role": "Financial Analyst",
        "full_name": "Test User",
        "is_active": True
    })
    
    response = client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["id"] == "test-uuid-1234"
    assert data["user"]["access_role"] == "learner"

def test_auth_me_missing_token():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_rbac_learner_cannot_access_admin_endpoint():
    learner_token = create_access_token({
        "sub": "learner-uuid",
        "email": "learner@novatech.com",
        "access_role": "learner",
        "is_active": True
    })
    
    response = client.get("/api/auth/admin/users", headers={
        "Authorization": f"Bearer {learner_token}"
    })
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

def test_rbac_admin_can_access_admin_endpoint():
    admin_token = create_access_token({
        "sub": "admin-uuid",
        "email": "admin@novatech.com",
        "access_role": "admin",
        "is_active": True
    })
    
    response = client.get("/api/auth/admin/users", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["admin"] == "admin@novatech.com"
    assert data["total_users"] > 0
