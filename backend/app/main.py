"""
main.py — application entry point (Phase 4A).

Startup order:
  1. Validate config files (skills.json, roles.json, scoring.json)
  2. Check Supabase connectivity (warn but don't block if unconfigured)
  3. Accept requests
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routers import analyze
from app.routers import data as data_router
from app.routers import ml as ml_router
from app.core.config_loader import validate_all
from app.core.supabase_client import check_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Step 1: Validate all JSON configs ────────────────────────────────────
    validate_all()

    # ── Step 2: Check Supabase (non-fatal) ───────────────────────────────────
    db_status = check_connection()
    if db_status["supabase"] == "connected":
        print(f"✅  Supabase connected → {db_status['url']}", flush=True)
    else:
        print(
            f"⚠️   Supabase: {db_status['supabase']} — {db_status.get('detail', '')}",
            flush=True,
        )

    yield


app = FastAPI(
    title="CampusSync Edge — Career Intelligence API",
    description=(
        "Phase 4A — Hybrid Intelligence Layer. "
        "Deterministic scoring · Config-driven roles · "
        "Supabase persistence · Similarity-based ML."
    ),
    version="4.0.0",
    lifespan=lifespan,
)

app.include_router(analyze.router)
app.include_router(data_router.router)
app.include_router(ml_router.router)


@app.get("/")
def root():
    db_status = check_connection()
    return {
        "status":   "Backend Running",
        "version":  "4.0.0 (Phase 4A — Hybrid Intelligence)",
        "database": db_status["supabase"],
    }