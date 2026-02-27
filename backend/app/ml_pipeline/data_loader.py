"""
data_loader.py (v2) — unified loader for real + synthetic data.

Adds load_combined_dataset() that fetches from both Supabase tables
and applies sample weights (real=1.5, synthetic=1.0).

Original load_dataset() is preserved for Phase 4A similarity engine.
"""

from app.core.supabase_client import get_supabase

# ── Sample weights ─────────────────────────────────────────────────────────────
WEIGHT_REAL      = 1.5
WEIGHT_SYNTHETIC = 1.0

_NUMERIC_FIELDS = [
    "core_coverage_percent",
    "optional_coverage_percent",
    "project_score_percent",
    "ats_score_percent",
    "structure_score_percent",
]


def _clean_record(row: dict, weight: float) -> dict | None:
    """Validate and normalise a raw Supabase row into a clean record dict."""
    skills = row.get("detected_skills") or []
    score  = row.get("final_score")

    if not isinstance(skills, list) or score is None:
        return None

    numeric = {
        field: int(row.get(field) or 0)
        for field in _NUMERIC_FIELDS
    }

    return {
        "detected_skills": [s.lower().strip() for s in skills if s],
        "role":            str(row.get("role", "Unknown")),
        "final_score":     int(score),
        **numeric,
        "sample_weight":   weight,
    }


# ── Phase 4A loader (real data only) ──────────────────────────────────────────

def load_dataset() -> list[dict]:
    """
    Fetch role_analyses joined with resume detected_skills.
    Used by Phase 4A similarity / projection engines.
    """
    try:
        sb = get_supabase()

        analyses = (
            sb.table("role_analyses")
            .select("id, resume_id, role, final_score")
            .execute()
            .data or []
        )
        if not analyses:
            return []

        resume_ids   = list({a["resume_id"] for a in analyses})
        resumes_resp = (
            sb.table("resumes")
            .select("id, detected_skills")
            .in_("id", resume_ids)
            .execute()
        )
        resume_map = {
            r["id"]: (r.get("detected_skills") or [])
            for r in (resumes_resp.data or [])
        }

        records = []
        for a in analyses:
            skills = resume_map.get(a["resume_id"], [])
            score  = a.get("final_score")
            if score is None:
                continue
            records.append({
                "resume_id":       a["resume_id"],
                "analysis_id":     a["id"],
                "role":            a.get("role", "Unknown"),
                "final_score":     int(score),
                "detected_skills": [s.lower().strip() for s in skills if s],
            })
        return records

    except EnvironmentError:
        return []


# ── Phase 4B loader (real + synthetic, with weights) ──────────────────────────

def load_combined_dataset() -> list[dict]:
    """
    Fetch and merge:
      - role_analyses (real resumes)  → sample_weight = 1.5
      - resume_analysis_synthetic     → sample_weight = 1.0

    Returns a flat list of clean record dicts ready for feature engineering.
    """
    try:
        sb = get_supabase()

        # ── Real data ─────────────────────────────────────────────────────────
        analyses = (
            sb.table("role_analyses")
            .select("*")
            .execute()
            .data or []
        )
        resume_ids   = list({a["resume_id"] for a in analyses})
        resumes_resp = (
            sb.table("resumes")
            .select("id, detected_skills")
            .in_("id", resume_ids)
            .execute()
            if resume_ids else type("R", (), {"data": []})()
        )
        resume_map = {
            r["id"]: (r.get("detected_skills") or [])
            for r in (resumes_resp.data or [])
        }

        real_records: list[dict] = []
        for a in analyses:
            merged = {**a, "detected_skills": resume_map.get(a["resume_id"], [])}
            rec    = _clean_record(merged, WEIGHT_REAL)
            if rec:
                real_records.append(rec)

        # ── Synthetic data ────────────────────────────────────────────────────
        synthetic_rows = (
            sb.table("resume_analysis_synthetic")
            .select("*")
            .execute()
            .data or []
        )
        synthetic_records: list[dict] = []
        for row in synthetic_rows:
            rec = _clean_record(row, WEIGHT_SYNTHETIC)
            if rec:
                synthetic_records.append(rec)

        combined = real_records + synthetic_records

        print(
            f"📊  Dataset loaded — "
            f"{len(real_records)} real (×{WEIGHT_REAL}) + "
            f"{len(synthetic_records)} synthetic (×{WEIGHT_SYNTHETIC}) "
            f"= {len(combined)} total",
            flush=True,
        )
        return combined

    except EnvironmentError as e:
        raise RuntimeError(f"Supabase not configured: {e}") from e
