from fastapi import FastAPI
from api.scenario_routes import router as scenario_router

app = FastAPI(title="CyberGuard AI Scenario API")

app.include_router(scenario_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to CyberGuard AI API"}
