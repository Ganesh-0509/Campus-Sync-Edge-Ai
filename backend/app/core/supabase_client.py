"""
supabase_client.py — Supabase connection singleton.

Loads credentials from .env and exposes get_supabase() for use in routers.
The client is lazily initialised on first call — the scoring engine works
even if Supabase is not yet configured.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env from backend root (works when running from backend/ directory)
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip()

_client: Client | None = None


def get_supabase() -> Client:
    """
    Return (or lazily create) the shared Supabase client.

    Raises EnvironmentError if credentials are missing or placeholder values.
    """
    global _client

    if _client is not None:
        return _client

    if not SUPABASE_URL or "xxxx" in SUPABASE_URL:
        raise EnvironmentError(
            "SUPABASE_URL is not set. "
            "Copy .env.example to .env and add your project URL."
        )
    if not SUPABASE_KEY or "your-" in SUPABASE_KEY:
        raise EnvironmentError(
            "SUPABASE_KEY is not set. "
            "Copy .env.example to .env and add your API key."
        )

    _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def check_connection() -> dict:
    """Ping Supabase to verify connectivity. Returns status dict."""
    try:
        sb = get_supabase()
        sb.table("resumes").select("id").limit(1).execute()
        return {"supabase": "connected", "url": SUPABASE_URL}
    except EnvironmentError as e:
        return {"supabase": "not_configured", "detail": str(e)}
    except Exception as e:
        return {"supabase": "error", "detail": str(e)}
