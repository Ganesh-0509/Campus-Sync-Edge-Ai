"""
data.py — history, comparison, analytics, and export endpoints.

All reads are from Supabase. Aggregations are done in Python since
Supabase REST API doesn't expose GROUP BY directly.
"""

from fastapi import APIRouter, HTTPException
from collections import defaultdict
from app.core.supabase_client import get_supabase

router = APIRouter()


def _db_error(e: Exception) -> HTTPException:
    if isinstance(e, EnvironmentError):
        return HTTPException(
            status_code=500,
            detail=f"Supabase not configured: {e}",
        )
    return HTTPException(
        status_code=500,
        detail=f"Database error: {e}",
    )


def _fmt(analysis: dict) -> dict:
    """Normalise a role_analyses row for API output."""
    return {
        "analysis_id":               analysis["id"],
        "role":                      analysis["role"],
        "final_score":               analysis["final_score"],
        "readiness_category":        analysis["readiness_category"],
        "core_coverage_percent":     analysis["core_coverage_percent"],
        "optional_coverage_percent": analysis["optional_coverage_percent"],
        "project_score_percent":     analysis["project_score_percent"],
        "ats_score_percent":         analysis["ats_score_percent"],
        "structure_score_percent":   analysis["structure_score_percent"],
        "missing_core_skills":       analysis.get("missing_core_skills")     or [],
        "missing_optional_skills":   analysis.get("missing_optional_skills") or [],
        "recommendations":           analysis.get("recommendations")         or [],
        "created_at":                analysis["created_at"],
    }


# ── GET /history/{resume_id} ───────────────────────────────────────────────────

@router.get("/history/{resume_id}")
def get_history(resume_id: int):
    """
    Chronological list of all role analyses for a given resume.
    Shows score progression over multiple submissions.
    """
    try:
        sb = get_supabase()

        resume_resp = sb.table("resumes").select(
            "id, filename, detected_skills, sections_detected, links, created_at"
        ).eq("id", resume_id).single().execute()

        if not resume_resp.data:
            raise HTTPException(status_code=404, detail=f"Resume {resume_id} not found.")

        analyses_resp = sb.table("role_analyses").select("*").eq(
            "resume_id", resume_id
        ).order("created_at", desc=False).execute()

        return {
            "resume_id":        resume_id,
            "filename":         resume_resp.data["filename"],
            "detected_skills":  resume_resp.data.get("detected_skills") or [],
            "uploaded_at":      resume_resp.data["created_at"],
            "history":          [_fmt(a) for a in (analyses_resp.data or [])],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise _db_error(e)


# ── GET /compare/{resume_id} ───────────────────────────────────────────────────

@router.get("/compare/{resume_id}")
def compare_roles(resume_id: int):
    """
    Latest analysis score per role for a resume.
    Useful for comparing how the candidate fits different roles.
    """
    try:
        sb = get_supabase()

        resume_resp = sb.table("resumes").select(
            "id, filename"
        ).eq("id", resume_id).single().execute()

        if not resume_resp.data:
            raise HTTPException(status_code=404, detail=f"Resume {resume_id} not found.")

        # Fetch all analyses ordered newest-first, then keep latest per role
        all_resp = sb.table("role_analyses").select("*").eq(
            "resume_id", resume_id
        ).order("created_at", desc=True).execute()

        seen_roles: set = set()
        latest_per_role: list = []

        for row in (all_resp.data or []):
            if row["role"] not in seen_roles:
                seen_roles.add(row["role"])
                latest_per_role.append(_fmt(row))

        # Sort best role first
        latest_per_role.sort(key=lambda x: -x["final_score"])

        return {
            "resume_id":       resume_id,
            "filename":        resume_resp.data["filename"],
            "best_role":       latest_per_role[0]["role"] if latest_per_role else None,
            "role_comparison": latest_per_role,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise _db_error(e)


# ── GET /analytics/role-stats ──────────────────────────────────────────────────

@router.get("/analytics/role-stats")
def role_stats():
    """
    Aggregated analytics across all analyses in the database:
      - Average / min / max score per role
      - Top 10 most frequently missing skills
      - Top 10 most commonly detected skills
    """
    try:
        sb = get_supabase()

        analyses = (sb.table("role_analyses").select("*").execute().data or [])
        resumes  = (sb.table("resumes").select("detected_skills").execute().data or [])

        # ── Per-role aggregation ─────────────────────────────────────────────
        role_buckets: dict = defaultdict(list)
        for a in analyses:
            role_buckets[a["role"]].append(a["final_score"])

        role_averages = [
            {
                "role":      role,
                "avg_score": round(sum(scores) / len(scores), 1),
                "min_score": min(scores),
                "max_score": max(scores),
                "count":     len(scores),
            }
            for role, scores in sorted(role_buckets.items())
        ]

        # ── Missing skill frequency ──────────────────────────────────────────
        missing_counter: dict = defaultdict(int)
        for a in analyses:
            for skill in (a.get("missing_core_skills") or []) + (a.get("missing_optional_skills") or []):
                missing_counter[skill] += 1

        # ── Detected skill frequency ─────────────────────────────────────────
        detected_counter: dict = defaultdict(int)
        for r in resumes:
            for skill in (r.get("detected_skills") or []):
                detected_counter[skill] += 1

        top_missing  = sorted(missing_counter.items(),  key=lambda x: -x[1])[:10]
        top_detected = sorted(detected_counter.items(), key=lambda x: -x[1])[:10]

        return {
            "total_analyses":    len(analyses),
            "total_resumes":     len(resumes),
            "role_averages":     role_averages,
            "top_missing_skills":  [{"skill": s, "count": c} for s, c in top_missing],
            "top_detected_skills": [{"skill": s, "count": c} for s, c in top_detected],
        }

    except Exception as e:
        raise _db_error(e)


# ── GET /export/dataset ────────────────────────────────────────────────────────

@router.get("/export/dataset")
def export_dataset():
    """
    Full ML-ready dataset — all analyses joined with their resume skills.
    Suitable for future model training or offline analysis.
    """
    try:
        sb = get_supabase()

        analyses = (sb.table("role_analyses").select("*").order("id").execute().data or [])

        # Fetch resume detected_skills in one query and build a lookup map
        resumes_resp = sb.table("resumes").select("id, filename, detected_skills").execute()
        resume_map   = {r["id"]: r for r in (resumes_resp.data or [])}

        dataset = []
        for a in analyses:
            resume = resume_map.get(a["resume_id"], {})
            dataset.append({
                "analysis_id":               a["id"],
                "resume_id":                 a["resume_id"],
                "filename":                  resume.get("filename", ""),
                "role":                      a["role"],
                "final_score":               a["final_score"],
                "readiness_category":        a["readiness_category"],
                "core_coverage_percent":     a["core_coverage_percent"],
                "optional_coverage_percent": a["optional_coverage_percent"],
                "project_score_percent":     a["project_score_percent"],
                "ats_score_percent":         a["ats_score_percent"],
                "structure_score_percent":   a["structure_score_percent"],
                "detected_skills":           resume.get("detected_skills") or [],
                "missing_core_skills":       a.get("missing_core_skills")     or [],
                "missing_optional_skills":   a.get("missing_optional_skills") or [],
                "analyzed_at":               a["created_at"],
            })

        return {"total": len(dataset), "dataset": dataset}

    except Exception as e:
        raise _db_error(e)
