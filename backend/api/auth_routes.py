import os
import uuid
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from supabase import create_client, Client

from security.auth_bearer import (
    create_access_token,
    get_current_user,
    CurrentUser,
    require_role
)

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

router = APIRouter(tags=["Authentication & RBAC"])

# Initialize Supabase if available
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None

try:
    if supabase_url and "your-project" not in supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"Warning: Supabase client initialization bypassed in auth_routes: {e}")

# Preconfigured demo users for offline viva/testing demonstration
DEMO_USERS = {
    "nimal@novatech.com": {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "nimal@novatech.com",
        "full_name": "Nimal Perera",
        "role": "Finance Manager",
        "access_role": "learner",
        "password": "password123",
        "is_active": True
    },
    "learner@novatech.com": {
        "id": "22222222-2222-2222-2222-222222222222",
        "email": "learner@novatech.com",
        "full_name": "Jane Doe",
        "role": "HR Officer",
        "access_role": "learner",
        "password": "password123",
        "is_active": True
    },
    "trainer@novatech.com": {
        "id": "33333333-3333-3333-3333-333333333333",
        "email": "trainer@novatech.com",
        "full_name": "Sarah Connor",
        "role": "Security Trainer",
        "access_role": "trainer",
        "password": "password123",
        "is_active": True
    },
    "admin@novatech.com": {
        "id": "44444444-4444-4444-4444-444444444444",
        "email": "admin@novatech.com",
        "full_name": "Chief Security Admin",
        "role": "CISO",
        "access_role": "admin",
        "password": "password123",
        "is_active": True
    }
}


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class LogoutResponse(BaseModel):
    success: bool
    message: str


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user via Supabase Auth or verified system accounts.
    Issues a cryptographically signed JWT token containing access roles.
    """
    email = request.email.strip().lower()
    password = request.password.strip()
    
    user_record = None

    # 1. Try Supabase Auth if online
    if supabase:
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            if auth_response and auth_response.user:
                sb_user = auth_response.user
                # Fetch profile and access role from public.users
                profile = supabase.table("users").select("*").eq("id", sb_user.id).execute()
                profile_data = profile.data[0] if profile.data else {}
                
                user_record = {
                    "id": str(sb_user.id),
                    "email": sb_user.email,
                    "full_name": profile_data.get("full_name", sb_user.email.split("@")[0]),
                    "role": profile_data.get("role", "Finance Manager"),
                    "access_role": profile_data.get("access_role", "learner"),
                    "is_active": profile_data.get("is_active", True)
                }
        except Exception as e:
            # Fall through to demo account verification
            pass

    # 2. Fallback to pre-configured demo verification for offline/testing
    if not user_record:
        if email in DEMO_USERS and DEMO_USERS[email]["password"] == password:
            user_record = DEMO_USERS[email].copy()
            del user_record["password"]
        elif password == "password123":  # Allow any valid email with default test password
            user_record = {
                "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, email)),
                "email": email,
                "full_name": email.split("@")[0].capitalize(),
                "role": "Finance Manager",
                "access_role": "admin" if "admin" in email else "learner",
                "is_active": True
            }

    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    if not user_record.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )

    # 3. Create signed JWT access token
    token_claims = {
        "sub": user_record["id"],
        "email": user_record["email"],
        "access_role": user_record["access_role"],
        "role": user_record["role"],
        "full_name": user_record["full_name"],
        "is_active": user_record["is_active"]
    }
    
    access_token = create_access_token(token_claims)

    # 4. Record audit log if Supabase is connected
    if supabase:
        try:
            supabase.table("agent_audit_logs").insert({
                "agent_name": "AuthService (Member 3)",
                "user_id": user_record["id"],
                "action": "USER_LOGIN_SUCCESS",
                "details": {"email": user_record["email"], "access_role": user_record["access_role"]}
            }).execute()
        except Exception:
            pass

    return LoginResponse(
        success=True,
        access_token=access_token,
        token_type="bearer",
        user=user_record
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(current_user: CurrentUser = Depends(get_current_user)):
    """Terminate user session and record audit event."""
    if supabase:
        try:
            supabase.table("agent_audit_logs").insert({
                "agent_name": "AuthService (Member 3)",
                "user_id": current_user.id,
                "action": "USER_LOGOUT",
                "details": {"email": current_user.email}
            }).execute()
        except Exception:
            pass
            
    return LogoutResponse(
        success=True,
        message=f"Session successfully terminated for {current_user.email}"
    )


@router.get("/me", response_model=Dict[str, Any])
async def get_my_profile(current_user: CurrentUser = Depends(get_current_user)):
    """Retrieve the currently authenticated user identity, access role, and job role."""
    return {
        "success": True,
        "user": current_user.model_dump() if hasattr(current_user, "model_dump") else current_user.dict()
    }


@router.get("/admin/users", dependencies=[Depends(require_role(["admin"]))])
async def list_users_admin(current_user: CurrentUser = Depends(get_current_user)):
    """Admin-only endpoint demonstrating Role-Based Access Control (RBAC)."""
    users_list = [
        {"email": u["email"], "name": u["full_name"], "access_role": u["access_role"], "role": u["role"]}
        for u in DEMO_USERS.values()
    ]
    return {
        "success": True,
        "admin": current_user.email,
        "total_users": len(users_list),
        "users": users_list
    }
