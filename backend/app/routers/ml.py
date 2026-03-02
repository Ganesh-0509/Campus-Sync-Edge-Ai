"""
ml.py — Phase 4A Hybrid Intelligence API endpoints.

Endpoints:
  POST /ml/predict-role       → cosine-similarity role prediction
  POST /ml/project-score      → simulate adding a skill, predict improvement
  GET  /ml/skill-impact       → skill impact rankings (cached or live)
  POST /ml/recompute-model    → rebuild and persist hybrid_v1.json snapshot
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ml_pipeline.data_loader     import load_dataset
from app.ml_pipeline.similarity_engine import predict_role
from app.ml_pipeline.skill_impact    import compute_skill_impact
from app.ml_pipeline.projection_engine import project_score
from app.ml_pipeline.model_registry  import (
    save_model, load_model, model_exists, build_role_stats
)

router = APIRouter(prefix="/ml", tags=["Hybrid Intelligence"])


# ── Request schemas ────────────────────────────────────────────────────────────

class RolePredictRequest(BaseModel):
    skills: list[str]
    project_score_percent: float = 0
    ats_score_percent: float = 0
    structure_score_percent: float = 0
    raw_text: str = ""
    sections_detected: list[str] = []
    current_role: str = ""

class ScoreProjectRequest(BaseModel):
    current_skills: list[str]
    add_skill: str


# ── Shared dataset guard ───────────────────────────────────────────────────────

def _require_data() -> list[dict]:
    records = load_dataset()
    if not records:
        raise HTTPException(
            status_code=404,
            detail=(
                "No historical data found. "
                "Upload and analyse at least one resume first."
            ),
        )
    return records


# ── POST /ml/predict-role ──────────────────────────────────────────────────────

@router.post("/predict-role")
def ml_predict_role(request: RolePredictRequest):
    """
    Predict the best-fit role by calculating the Readiness Score 
    for the current resume across all support roles in the system.
    """
    try:
        from app.services.role_readiness_engine import calculate_role_readiness
        from app.services.role_matrix import VALID_ROLES
        
        best_role = ""
        best_score = -1
        all_results = []

        for role in VALID_ROLES:
            res = calculate_role_readiness(
                resume_skills=request.skills,
                sections_detected=request.sections_detected,
                raw_text=request.raw_text,
                role_name=role
            )
            
            score = res.get("final_score", 0)
            all_results.append({
                "role": role,
                "score": score
            })

            if score > best_score:
                best_score = score
                best_role = role

        # Sort matches by score
        all_results.sort(key=lambda x: -x["score"])
        
        # Calculate reasoning
        if request.current_role and best_role == request.current_role:
             reasoning = f"Your resume is a perfect fit for {best_role}! You match {int(best_score)}% of the core requirements."
        elif request.current_role:
            current_score = next((r["score"] for r in all_results if r["role"] == request.current_role), 0)
            reasoning = f"Your profile matches {best_role} at {int(best_score)}%, which is a much stronger match than {request.current_role} ({int(current_score)}%)."
        else:
            reasoning = f"Your highest potential match is {best_role} with a score of {int(best_score)}%."

        return {
            "predicted_role": best_role,
            "confidence": best_score / 100.0,
            "top_matches": all_results[:3],
            "reasoning": reasoning,
            "model_version": "cross-role-validator-v1"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /ml/project-score ─────────────────────────────────────────────────────

@router.post("/project-score")
def ml_project_score(request: ScoreProjectRequest):
    """
    Simulate adding a skill to the current skill set and predict
    the expected score change using similarity-weighted averaging.

    Returns current and projected scores plus a recommendation.
    """
    try:
        records = _require_data()
        result  = project_score(
            request.current_skills,
            request.add_skill,
            records,
        )
        result["dataset_size"] = len(records)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /ml/skill-impact ───────────────────────────────────────────────────────

@router.get("/skill-impact")
def ml_skill_impact(live: bool = False):
    """
    Return skill impact rankings (delta from global mean score).

    - By default, returns the cached model snapshot (fast).
    - Pass ?live=true to recompute from live data on the fly.
    """
    try:
        if not live and model_exists():
            model = load_model()
            return {
                "source":               "cached_model",
                "updated_at":           model["updated_at"],
                "dataset_size":         model["dataset_size"],
                "global_mean_score":    model["global_mean_score"],
                "skill_impact_ranking": model["skill_impact_ranking"],
            }

        records = _require_data()
        result  = compute_skill_impact(records)
        return {"source": "live_compute", **result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /ml/recompute-model ───────────────────────────────────────────────────

@router.post("/recompute-model")
def ml_recompute_model():
    """
    Recompute all intelligence from the full dataset and save to hybrid_v1.json.

    Call this after uploading a batch of new resumes to refresh the insights.
    Returns a summary of the new snapshot.
    """
    try:
        records      = _require_data()
        skill_impact = compute_skill_impact(records)
        role_stats   = build_role_stats(records)
        model        = save_model(len(records), skill_impact, role_stats)

        return {
            "status":                "model_recomputed",
            "dataset_size":          model["dataset_size"],
            "updated_at":            model["updated_at"],
            "global_mean_score":     model["global_mean_score"],
            "roles_tracked":         list(role_stats.keys()),
            "skills_ranked":         len(model["skill_impact_ranking"]),
            "top_5_impact_skills":   model["skill_impact_ranking"][:5],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /ml/status ─────────────────────────────────────────────────────────────

@router.get("/status")
def ml_status():
    """Quick health-check: returns model cache status and dataset size."""
    try:
        records = load_dataset()
        model   = load_model()
        return {
            "dataset_size":     len(records),
            "model_cached":     model_exists(),
            "model_updated_at": model["updated_at"] if model else None,
            "ready":            len(records) > 0,
        }
    except Exception as e:
        return {"ready": False, "error": str(e)}
