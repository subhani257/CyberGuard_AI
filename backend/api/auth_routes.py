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
DEMO_MODE = os.environ.get("CYBERGUARD_DEMO_MODE", "false").lower() == "true"

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
        "company": "NovaTech Solutions",
        "access_role": "learner",
        "password": "password123",
        "is_active": True
    },
    "learner@novatech.com": {
        "id": "22222222-2222-2222-2222-222222222222",
        "email": "learner@novatech.com",
        "full_name": "Jane Doe",
        "role": "HR Officer",
        "company": "NovaTech Solutions",
        "access_role": "learner",
        "password": "password123",
        "is_active": True
    },
    "trainer@novatech.com": {
        "id": "33333333-3333-3333-3333-333333333333",
        "email": "trainer@novatech.com",
        "full_name": "Sarah Connor",
        "role": "Security Trainer",
        "company": "NovaTech Solutions",
        "access_role": "trainer",
        "password": "password123",
        "is_active": True
    },
    "admin@novatech.com": {
        "id": "44444444-4444-4444-4444-444444444444",
        "email": "admin@novatech.com",
        "full_name": "Chief Security Admin",
        "role": "CISO",
        "company": "NovaTech Solutions",
        "access_role": "admin",
        "password": "password123",
        "is_active": True
    }
}


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "Employee"
    company: Optional[str] = None
    access_role: Optional[str] = "learner"


class GoogleAuthRequest(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = "alex.turner@techcorp.io"
    full_name: Optional[str] = "Alex Turner"
    role: Optional[str] = "Employee"
    company: Optional[str] = "NovaTech Solutions"
    id_token: Optional[str] = None
    access_token: Optional[str] = None


class SyncUserRequest(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = "Employee"


class LoginResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class LogoutResponse(BaseModel):
    success: bool
    message: str


@router.post("/sync-user")
async def sync_user(
    request: SyncUserRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Explicitly synchronizes Supabase OAuth / Auth user into public.users.
    Guarantees public.users has matching record for foreign keys and RLS.
    """
    user_id = current_user.id
    email = current_user.email
    full_name = (request.full_name or email.split("@")[0]).strip()
    role = (request.role or "Employee").strip()

    if supabase:
        try:
            supabase.table("users").upsert({
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role,
                "readiness_score": 50
            }).execute()
            return {"success": True, "user_id": user_id, "email": email, "synced": True}
        except Exception as e:
            print(f"Error in sync_user: {e}")
            return {"success": False, "error": str(e)}

    return {"success": True, "user_id": user_id, "email": email, "synced": False, "mode": "in-memory"}


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
                    "company": profile_data.get("company", "Your Organization"),
                    "access_role": profile_data.get("access_role", "learner"),
                    "is_active": profile_data.get("is_active", True)
                }
        except Exception as e:
            # Fall through to demo account verification
            pass

    # 2. Explicit offline classroom-demo accounts
    if not user_record and DEMO_MODE:
        if email in DEMO_USERS and DEMO_USERS[email]["password"] == password:
            user_record = DEMO_USERS[email].copy()
            del user_record["password"]

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
        "company": user_record.get("company", "Your Organization"),
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


@router.post("/signup", response_model=LoginResponse)
async def signup(request: SignupRequest):
    """
    Register a new user account.
    Creates profile in Supabase and issues access token.
    """
    email = request.email.strip().lower()
    password = request.password.strip()
    full_name = (request.full_name or email.split("@")[0]).strip()
    role = (request.role or "Employee").strip()
    company = (request.company or "NovaTech").strip()
    # Public signup can only create learners. Role elevation is an admin operation.
    access_role = "learner"
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email))

    if len(password) < 10:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must contain at least 10 characters")
    if not supabase and not DEMO_MODE:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Registration service is not configured")

    # 1. Attempt Supabase registration if online
    if supabase:
        try:
            auth_res = supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            if auth_res and auth_res.user:
                user_id = str(auth_res.user.id)
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration did not create a user")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Registration failed: {e}")

        try:
            # Upsert into public.users
            supabase.table("users").upsert({
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role,
                "company": company,
                "access_role": access_role,
                "is_active": True,
                "readiness_score": 50
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"User profile persistence failed: {e}")

    user_record = {
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "company": company,
        "access_role": access_role,
        "is_active": True
    }

    token_claims = {
        "sub": user_record["id"],
        "email": user_record["email"],
        "access_role": user_record["access_role"],
        "role": user_record["role"],
        "full_name": user_record["full_name"],
        "company": company,
        "is_active": True
    }
    access_token = create_access_token(token_claims)

    return LoginResponse(
        success=True,
        access_token=access_token,
        token_type="bearer",
        user=user_record
    )


@router.post("/google", response_model=LoginResponse)
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticate or register user via Google identity.
    Provides immediate one-tap OAuth session with demo fallback.
    """
    verified_user = None
    if supabase and request.access_token:
        try:
            verified_response = supabase.auth.get_user(request.access_token)
            verified_user = getattr(verified_response, "user", None)
        except Exception:
            verified_user = None

    if not verified_user and not DEMO_MODE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="A verified Google OAuth session is required")

    metadata = (getattr(verified_user, "user_metadata", {}) or {}) if verified_user else {}
    email = (getattr(verified_user, "email", None) if verified_user else request.email) or ""
    email = email.strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account email is missing")
    full_name = str(metadata.get("full_name") or metadata.get("name") or request.full_name or email.split("@")[0]).strip()
    role = str(metadata.get("role") or request.role or "Employee").strip()
    company = str(metadata.get("company") or request.company or "Your Organization").strip()
    user_id = str(getattr(verified_user, "id", None) or request.id or uuid.uuid5(uuid.NAMESPACE_DNS, email))

    if supabase:
        try:
            # Check if user already exists
            existing = supabase.table("users").select("*").eq("email", email).execute()
            if existing.data and len(existing.data) > 0:
                user_id = existing.data[0]["id"]
                full_name = existing.data[0].get("full_name") or full_name
                role = existing.data[0].get("role") or role
            else:
                supabase.table("users").upsert({
                    "id": user_id,
                    "email": email,
                    "full_name": full_name,
                    "role": role,
                    "company": company,
                    "access_role": "learner",
                    "is_active": True,
                    "readiness_score": 60
                }).execute()
        except Exception as e:
            print(f"Notice: Supabase upsert in google_auth: {e}")

    user_record = {
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "company": company,
        "access_role": "learner",
        "is_active": True
    }

    token_claims = {
        "sub": user_record["id"],
        "email": user_record["email"],
        "access_role": user_record["access_role"],
        "role": user_record["role"],
        "full_name": user_record["full_name"],
        "company": company,
        "is_active": True
    }
    access_token = create_access_token(token_claims)

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
