"""
main.py — application entry point.

Startup order:
  1. Validate config files (skills.json, roles.json, scoring.json)
  2. Check Supabase connectivity (warn but don't block if unconfigured)
  3. Accept requests
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routers import analyze
from app.routers import data as data_router
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
        print(f"⚠️   Supabase status: {db_status['supabase']} — {db_status.get('detail', '')}", flush=True)
        print("    Scoring engine will still work. Set SUPABASE_URL + SUPABASE_KEY in .env to enable persistence.", flush=True)

    yield


app = FastAPI(
    title="CampusSync Edge — Career Intelligence API",
    description=(
        "Phase 3 — Data-Driven Intelligence. "
        "Deterministic scoring · Config-driven roles · Supabase persistence."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

app.include_router(analyze.router)
app.include_router(data_router.router)


@app.get("/")
def root():
    db_status = check_connection()
    return {
        "status":   "Backend Running",
        "version":  "3.0.0 (Phase 3 — Data-Driven)",
        "database": db_status["supabase"],
    }