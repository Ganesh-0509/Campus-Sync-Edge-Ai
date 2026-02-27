"""
data_loader.py — fetch and clean resume analysis records from Supabase.

Returns a flat list of dicts ready for the similarity and impact engines.
Handles missing values gracefully so the pipeline is stable on small datasets.
"""

from app.core.supabase_client import get_supabase


def load_dataset() -> list[dict]:
    """
    Fetch all role_analyses joined with resume detected_skills.

    Returns a list of records:
        {
            "resume_id":       int,
            "analysis_id":     int,
            "role":            str,
            "final_score":     int,
            "detected_skills": list[str],
        }

    Empty list is returned (not an error) when the DB has no data yet.
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

        # Batch-fetch all resumes we need
        resume_ids = list({a["resume_id"] for a in analyses})
        resumes_resp = (
            sb.table("resumes")
            .select("id, detected_skills")
            .in_("id", resume_ids)
            .execute()
        )
        resume_map: dict[int, list] = {
            r["id"]: (r.get("detected_skills") or [])
            for r in (resumes_resp.data or [])
        }

        records = []
        for a in analyses:
            skills = resume_map.get(a["resume_id"], [])

            # ── Clean: skip records with no skills or invalid score ───────────
            if not isinstance(skills, list):
                skills = []
            score = a.get("final_score")
            if score is None or not isinstance(score, (int, float)):
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
        return []   # Supabase not configured — pipeline degrades gracefully
