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
    Predict the best-fit role for a given skill set using cosine similarity
    against all analysed resumes in the database.

    Returns predicted role, confidence score, and top-3 matching records.
    """
    try:
        records = _require_data()
        result  = predict_role(request.skills, records)
        result["dataset_size"] = len(records)
        return result
    except HTTPException:
        raise
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
