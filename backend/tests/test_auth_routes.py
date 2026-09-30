import pytest
import asyncio
import inspect
from unittest.mock import Mock

from fastapi.testclient import TestClient
from main import app
from api import auth_routes, coach_routes
from security.auth_bearer import CurrentUser, create_access_token

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

def test_sync_user_endpoint(learner_headers):
    response = client.post("/api/auth/sync-user", json={
        "user_id": "99999999-9999-9999-9999-999999999999",
        "email": "sync_test@novatech.com",
        "full_name": "Sync Test User",
        "role": "Cloud Architect"
    }, headers=learner_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user_id"] == "11111111-1111-1111-1111-111111111111"


def test_google_auth_endpoint():
    response = client.post("/api/auth/google", json={
        "id": "88888888-8888-8888-8888-888888888888",
        "email": "google_test@novatech.com",
        "full_name": "Google Tester",
        "role": "Lead Architect"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == "google_test@novatech.com"


def test_logout_schedules_supabase_audit_without_executing_it_in_request(monkeypatch):
    monkeypatch.setattr(auth_routes, "supabase", Mock())
    background_tasks = Mock()
    current_user = CurrentUser(
        id="logout-user-id",
        email="logout@example.com",
        access_role="learner",
    )

    response = asyncio.run(auth_routes.logout(background_tasks, current_user))

    assert response.success is True
    background_tasks.add_task.assert_called_once_with(
        auth_routes._record_logout_audit,
        "logout-user-id",
        "logout@example.com",
    )


def test_database_backed_auth_and_dashboard_handlers_use_worker_threads():
    assert inspect.iscoroutinefunction(auth_routes.login) is False
    assert inspect.iscoroutinefunction(auth_routes.google_auth) is False
    assert inspect.iscoroutinefunction(coach_routes.get_dashboard_summary) is False


def test_login_schedules_audit_outside_the_response_path(monkeypatch):
    monkeypatch.setattr(auth_routes, "supabase", Mock())
    background_tasks = Mock()

    response = auth_routes.login(
        auth_routes.LoginRequest(email="nimal@novatech.com", password="password123"),
        background_tasks,
    )

    assert response.success is True
    background_tasks.add_task.assert_called_once_with(
        auth_routes._record_login_audit,
        "11111111-1111-1111-1111-111111111111",
        "nimal@novatech.com",
        "learner",
    )

