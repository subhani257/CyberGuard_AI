from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.scenario_routes import router as scenario_router
from api.evaluation_routes import router as evaluation_router
from api.auth_routes import router as auth_router
from api.coach_routes import router as coach_router
from api.org_routes import router as org_router

app = FastAPI(
    title="CyberGuard AI API",
    description="Adaptive Multi-Agent Cybersecurity Awareness Training Platform",
    version="1.0.0"
)

# Cross-Origin Resource Sharing (CORS) for Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routers across the 3-Member Architecture:
# Member 1: Scenario Generation & Personalization & Org Ingestion
app.include_router(scenario_router, prefix="/api")
app.include_router(org_router, prefix="/api/org")

# Member 2: Decision Evaluation & Security Analysis
app.include_router(evaluation_router, prefix="/api/agents")

# Member 3: Authentication, RBAC & Adaptive Training Coach
app.include_router(auth_router, prefix="/api/auth")
app.include_router(coach_router, prefix="/api/coach")

@app.get("/")
def root():
    return {"message": "Welcome to CyberGuard AI API"}

@app.get("/api/system/architecture")
def system_architecture():
    return {
        "system": "CyberGuard AI API",
        "status": "operational",
        "architecture": "3-Member Multi-Agent Balanced Contribution Model",
        "modules": {
            "member_1": "Scenario Generation & Personalization Agent (/api/generate-scenario)",
            "member_2": "Decision Evaluation & Security Analysis Agent (/api/agents/evaluate)",
            "member_3": "Adaptive Training Coach Agent & Auth/RBAC (/api/coach, /api/auth)"
        }
    }
