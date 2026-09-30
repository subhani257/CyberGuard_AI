import base64
import hashlib
import hmac
import json
import time
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from api import auth_routes
from main import app
from security import auth_bearer
from security.auth_bearer import create_access_token, decode_access_token


client = TestClient(app)


def _encode(value):
    raw = json.dumps(value, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")


def _signed_token(payload, header=None):
    encoded_header = _encode(header or {"alg": "HS256", "typ": "JWT"})
    encoded_payload = _encode(payload)
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(
        auth_bearer._get_jwt_secret().encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=").decode("utf-8")
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def _auth_header(payload):
    return {"Authorization": f"Bearer {_signed_token(payload)}"}


def test_access_token_round_trip_has_bounded_lifetime():
    before = int(time.time())
    token = create_access_token({"sub": "user-1", "email": "user@example.com"})
    claims = decode_access_token(token)
    after = int(time.time())

    assert claims["sub"] == "user-1"
    assert before <= claims["iat"] <= after
    assert auth_bearer.TOKEN_EXPIRATION_SECONDS - 1 <= claims["exp"] - claims["iat"] <= auth_bearer.TOKEN_EXPIRATION_SECONDS


def test_zero_second_token_lifetime_is_not_replaced_with_default_lifetime():
    token = create_access_token({"sub": "user-1"}, expires_delta=0)
    with pytest.raises(HTTPException) as error:
        decode_access_token(token)
    assert error.value.status_code == 401
    assert "expired" in error.value.detail.lower()


@pytest.mark.parametrize(
    ("payload", "detail"),
    [
        ({"sub": "user-1"}, "expiration"),
        ({"sub": "user-1", "exp": "tomorrow"}, "expiration"),
        ({"sub": "user-1", "exp": True}, "expiration"),
        ({"sub": "user-1", "exp": time.time() + 300, "iat": "now"}, "iat"),
        ({"sub": "user-1", "exp": time.time() + 300, "nbf": "later"}, "nbf"),
        ({"sub": "user-1", "exp": time.time() - 1}, "expired"),
        ({"sub": "user-1", "exp": time.time() + 300, "iat": time.time() + 120}, "not active"),
        ({"sub": "user-1", "exp": time.time() + 300, "nbf": time.time() + 120}, "not active"),
    ],
)
def test_decode_access_token_rejects_invalid_numeric_date_claims(payload, detail):
    with pytest.raises(HTTPException) as error:
        decode_access_token(_signed_token(payload))
    assert error.value.status_code == 401
    assert detail in error.value.detail.lower()


def test_decode_access_token_rejects_bad_structure_algorithm_type_and_signature():
    valid_payload = {"sub": "user-1", "exp": time.time() + 300}
    invalid_tokens = [
        "not-a-jwt",
        _signed_token(valid_payload, {"alg": "none", "typ": "JWT"}),
        _signed_token(valid_payload, {"alg": "HS256", "typ": "NOT-JWT"}),
        _signed_token(valid_payload)[:-1] + "x",
        "x" * 8193,
    ]
    for token in invalid_tokens:
        with pytest.raises(HTTPException) as error:
            decode_access_token(token)
        assert error.value.status_code == 401


@pytest.mark.parametrize(
    "claims",
    [
        {"email": "user@example.com", "access_role": "learner", "is_active": True},
        {"sub": " ", "email": "user@example.com", "access_role": "learner", "is_active": True},
        {"sub": "user-1", "email": "user@example.com", "access_role": "superadmin", "is_active": True},
    ],
)
def test_me_rejects_missing_identity_and_unknown_access_roles(claims):
    claims["exp"] = time.time() + 300
    response = client.get("/api/auth/me", headers=_auth_header(claims))
    assert response.status_code == 401


@pytest.mark.parametrize("inactive_value", [False, "false", 0, None])
def test_me_rejects_any_non_true_active_claim(inactive_value):
    response = client.get(
        "/api/auth/me",
        headers=_auth_header({
            "sub": "user-1",
            "email": "user@example.com",
            "access_role": "learner",
            "is_active": inactive_value,
            "exp": time.time() + 300,
        }),
    )
    assert response.status_code == 403


def test_login_normalizes_email_but_does_not_silently_trim_password():
    normalized = client.post("/api/auth/login", json={
        "email": "  LEARNER@NOVATECH.COM  ",
        "password": "password123",
    })
    assert normalized.status_code == 200
    assert normalized.json()["user"]["email"] == "learner@novatech.com"

    changed_password = client.post("/api/auth/login", json={
        "email": "learner@novatech.com",
        "password": "password123 ",
    })
    assert changed_password.status_code == 401


@pytest.mark.parametrize(
    "body",
    [
        {"email": "not-an-email", "password": "password123"},
        {"email": "learner@novatech.com", "password": ""},
        {"email": "learner@novatech.com", "password": "x" * 129},
        {"email": "learner@novatech.com", "password": "password123", "unexpected": True},
    ],
)
def test_login_rejects_malformed_or_unexpected_input(body):
    assert client.post("/api/auth/login", json=body).status_code == 422


@pytest.mark.parametrize(
    "body",
    [
        {"email": "bad", "password": "long-enough-password"},
        {"email": "new@example.com", "password": "short"},
        {"email": "new@example.com", "password": "x" * 129},
        {"email": "new@example.com", "password": "long-enough-password", "access_role": "admin"},
        {"email": "new@example.com", "password": "long-enough-password", "unknown": "field"},
    ],
)
def test_signup_rejects_invalid_input_and_role_escalation(body):
    assert client.post("/api/auth/signup", json=body).status_code == 422


def test_signup_normalizes_fields_and_always_creates_a_learner():
    response = client.post("/api/auth/signup", json={
        "email": "  New.User@Example.com ",
        "password": "long-enough-password",
        "full_name": "  New User  ",
        "company": "  Example Ltd  ",
        "access_role": "learner",
    })
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["email"] == "new.user@example.com"
    assert user["full_name"] == "New User"
    assert user["company"] == "Example Ltd"
    assert user["access_role"] == "learner"


def test_google_auth_requires_email_and_rejects_spoofed_fields():
    assert client.post("/api/auth/google", json={"id": "user-1"}).status_code == 401
    assert client.post("/api/auth/google", json={
        "id": "user-1",
        "email": "user@example.com",
        "access_role": "admin",
    }).status_code == 422


def test_google_auth_normalizes_identity_and_issues_only_learner_access():
    response = client.post("/api/auth/google", json={
        "id": "google-user-1",
        "email": "  GOOGLE.USER@EXAMPLE.COM ",
        "full_name": "  Google User  ",
        "company": "  Example Ltd  ",
    })
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["email"] == "google.user@example.com"
    assert user["full_name"] == "Google User"
    assert user["access_role"] == "learner"


def test_google_auth_requires_verified_provider_outside_demo_mode(monkeypatch):
    monkeypatch.setattr(auth_routes, "DEMO_MODE", False)
    monkeypatch.setattr(auth_routes, "supabase", None)
    response = client.post("/api/auth/google", json={
        "id": "google-user-1",
        "email": "google.user@example.com",
    })
    assert response.status_code == 401
    assert "verified" in response.json()["detail"].lower()


def test_google_auth_uses_verified_provider_identity_not_spoofed_request_fields(monkeypatch):
    class FakeTable:
        def select(self, *_args, **_kwargs):
            return self

        def eq(self, *_args, **_kwargs):
            return self

        def upsert(self, *_args, **_kwargs):
            return self

        def execute(self):
            return SimpleNamespace(data=[])

    class FakeAuth:
        def get_user(self, token):
            assert token == "verified-provider-token"
            return SimpleNamespace(user=SimpleNamespace(
                id="verified-user-id",
                email="verified@example.com",
                user_metadata={"full_name": "Verified Person", "company": "Verified Co"},
            ))

    fake_supabase = SimpleNamespace(auth=FakeAuth(), table=lambda _name: FakeTable())
    monkeypatch.setattr(auth_routes, "DEMO_MODE", False)
    monkeypatch.setattr(auth_routes, "supabase", fake_supabase)

    response = client.post("/api/auth/google", json={
        "access_token": "verified-provider-token",
        "id": "spoofed-id",
        "email": "spoofed@example.com",
        "full_name": "Spoofed Name",
        "company": "Spoofed Co",
    })
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["id"] == "verified-user-id"
    assert user["email"] == "verified@example.com"
    assert user["full_name"] == "Verified Person"
    assert user["company"] == "Verified Co"
    assert user["access_role"] == "learner"


def test_logout_requires_a_currently_valid_token():
    assert client.post("/api/auth/logout").status_code == 401
    expired = _auth_header({
        "sub": "user-1",
        "email": "user@example.com",
        "access_role": "learner",
        "is_active": True,
        "exp": time.time() - 10,
    })
    assert client.post("/api/auth/logout", headers=expired).status_code == 401


def test_profile_update_rejects_empty_unknown_and_oversized_fields(learner_headers):
    assert client.put("/api/auth/profile", json={}, headers=learner_headers).status_code == 422
    assert client.put("/api/auth/profile", json={"unknown": "value"}, headers=learner_headers).status_code == 422
    assert client.put("/api/auth/profile", json={"full_name": "x" * 101}, headers=learner_headers).status_code == 422
