from fastapi import FastAPI
from api.scenario_routes import router as scenario_router
from api.evaluation_routes import router as evaluation_router

app = FastAPI(title="CyberGuard AI API")

app.include_router(scenario_router, prefix="/api")
app.include_router(evaluation_router, prefix="/api/agents")

@app.get("/")
def root():
    return {"message": "Welcome to CyberGuard AI API"}
