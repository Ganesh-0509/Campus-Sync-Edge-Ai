"""
inference.py — ML inference API router.

Endpoints:
  GET  /health   → model load status + key metrics
  POST /predict  → full resume intelligence prediction
"""

from __future__ import annotations
import logging

from fastapi import APIRouter, HTTPException

from app.schemas     import ResumeInput, ResumePrediction, HealthResponse
from app.predictor   import predict_resume
from app.model_loader import is_loaded, get_metadata, get_vocabulary
from app.inference_utils import Timer

log = logging.getLogger("inference")
router = APIRouter(tags=["ML Inference"])


# ── GET /health ────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, summary="Model health check")
def health_check() -> HealthResponse:
    """
    Returns model load status and key performance metrics.
    Use this to verify the inference layer is ready before sending predictions.
    """
    if not is_loaded():
        return HealthResponse(
            status       = "models_not_loaded",
            model_loaded = False,
        )

    meta = get_metadata()
    vocab = get_vocabulary()

    return HealthResponse(
        status          = "ready",
        model_loaded    = True,
        model_version   = meta.get("version"),
        vocabulary_size = len(vocab),
        trained_on      = meta.get("trained_on_records"),
        accuracy        = meta.get("accuracy"),
    )


# ── POST /predict ──────────────────────────────────────────────────────────────

@router.post(
    "/predict",
    response_model = ResumePrediction,
    summary        = "Predict role and score from resume features",
)
def predict_endpoint(body: ResumeInput) -> ResumePrediction:
    """
    Run full ML inference on a resume feature vector.

    - Predicts the best-fit role (RandomForestClassifier)
    - Predicts the resume quality score (RandomForestRegressor)
    - Returns confidence and up to 3 weak areas

    **Skills must be provided in lowercase form matching the training vocabulary.**
    """
    if not is_loaded():
        raise HTTPException(
            status_code = 503,
            detail      = (
                "ML models are not loaded. "
                "Train models first: python -m app.ml_pipeline.train_v2 --seed 42"
            ),
        )

    t = Timer()
    try:
        result = predict_resume(body)
    except Exception as e:
        log.exception("Prediction failed for input: %s", body.model_dump())
        raise HTTPException(
            status_code = 500,
            detail      = f"Inference failed: {str(e)}",
        )

    elapsed_ms = t()
    log.info(
        "POST /predict  role=%s  score=%.1f  conf=%.2f  latency=%.1fms",
        result["predicted_role"], result["resume_score"],
        result["confidence"], elapsed_ms,
    )

    return ResumePrediction(
        predicted_role    = result["predicted_role"],
        confidence        = result["confidence"],
        resume_score      = result["resume_score"],
        weak_areas        = result["weak_areas"],
        model_version     = result["model_version"],
        inference_time_ms = elapsed_ms,
    )
