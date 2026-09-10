import os
import hmac
import hashlib
import base64
import json
import time
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "cyberguard_ai_secret_super_secure_key_2026")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRATION_SECONDS = 86400  # 24 hours

security_bearer = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    email: str
    access_role: str = "learner"  # "learner", "trainer", "admin"
    role: str = "Finance Manager"  # Business/job role for scenarios
    full_name: str = "Learner User"
    is_active: bool = True


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def _base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if len(data) % 4 != 0 else ''
    return base64.urlsafe_b64decode((data + padding).encode('utf-8'))


def create_access_token(payload: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Create a standard HS256 cryptographically signed JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    exp = int(time.time()) + (expires_delta if expires_delta else TOKEN_EXPIRATION_SECONDS)
    
    token_payload = payload.copy()
    token_payload["exp"] = exp
    token_payload["iat"] = int(time.time())
    
    encoded_header = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    encoded_payload = _base64url_encode(json.dumps(token_payload, separators=(',', ':')).encode('utf-8'))
    
    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
    encoded_signature = _base64url_encode(signature)
    
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and cryptographically verify an HS256 JWT token."""
    parts = token.strip().split('.')
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure"
        )
    
    encoded_header, encoded_payload, encoded_signature = parts
    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    expected_signature = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
    
    try:
        actual_signature = _base64url_decode(encoded_signature)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token signature"
        )
    
    # Constant time comparison to prevent timing attacks
    if not hmac.compare_digest(expected_signature, actual_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or tampered token signature"
        )
    
    try:
        payload_bytes = _base64url_decode(encoded_payload)
        payload = json.loads(payload_bytes.decode('utf-8'))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Check expiration
    exp = payload.get("exp")
    if exp and int(exp) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
        
    return payload


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> CurrentUser:
    """FastAPI dependency to extract and validate the authenticated user from JWT Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token in the Authorization header."
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    user_id = payload.get("sub") or payload.get("id")
    email = payload.get("email", "")
    access_role = payload.get("access_role", "learner")
    role = payload.get("role", "Finance Manager")
    full_name = payload.get("full_name", "CyberGuard Learner")
    is_active = payload.get("is_active", True)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identity subject (sub)"
        )
        
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or disabled"
        )
        
    return CurrentUser(
        id=str(user_id),
        email=email,
        access_role=access_role,
        role=role,
        full_name=full_name,
        is_active=is_active
    )


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> Optional[CurrentUser]:
    """Optional JWT token extractor that returns None instead of raising 401 when token is absent."""
    if not credentials or not credentials.credentials:
        return None
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        user_id = payload.get("sub") or payload.get("id")
        if not user_id:
            return None
        return CurrentUser(
            id=str(user_id),
            email=payload.get("email", ""),
            access_role=payload.get("access_role", "learner"),
            role=payload.get("role", "Finance Manager"),
            full_name=payload.get("full_name", "CyberGuard Learner"),
            is_active=payload.get("is_active", True)
        )
    except Exception:
        return None


def require_role(allowed_roles: List[str]):
    """Role-Based Access Control (RBAC) dependency generator."""
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.access_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}. Your role: '{current_user.access_role}'"
            )
        return current_user
    return role_checker
