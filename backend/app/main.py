"""WomenAId FastAPI application entry point."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db.database import init_db
from app.routers import admin, auth, monitoring, risk_assessment


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="WomenAId API", lifespan=lifespan)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(risk_assessment.clinic_router)
app.include_router(risk_assessment.upload_router)
app.include_router(monitoring.clinic_router)
app.include_router(monitoring.patient_router)
app.include_router(admin.router)
