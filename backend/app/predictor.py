"""
predictor.py — feature transformation and inference logic.

Two public functions:
  transform_input(input_data, vocabulary) → np.ndarray
  predict_resume(input_data)              → dict

CRITICAL: The numeric feature ORDER must match the training pipeline exactly.

Training pipeline (feature_engineering.py) appended numeric features as:
  [core_coverage_percent/100, optional_coverage_percent/100,
   project_score_percent/100, ats_score_percent/100,
   structure_score_percent/100]

This file reproduces that exact ordering.
"""

from __future__ import annotations
import logging

import numpy as np

from app.model_loader import get_role_model, get_score_model, get_vocabulary, get_metadata
from app.inference_utils import clamp

log = logging.getLogger("predictor")

# ── Must match _NUMERIC_FIELDS order in feature_engineering.py ────────────────
_NUMERIC_FIELD_ORDER = [
    "core_coverage",        # → core_coverage_percent/100
    "optional_coverage",    # → optional_coverage_percent/100
    "project_score",        # → project_score_percent/100
    "ats_score",            # → ats_score_percent/100
    "structure_score",      # → structure_score_percent/100
]

_NUMERIC_DISPLAY_NAMES = {
    "core_coverage":    "Core Coverage",
    "optional_coverage": "Optional Coverage",
    "project_score":    "Project Score",
    "ats_score":        "ATS Score",
    "structure_score":  "Structure Score",
}

_WEAK_THRESHOLD = 50.0   # any value < 50 → considered weak


# ── Feature transformation ─────────────────────────────────────────────────────

def transform_input(input_data, vocabulary: list[str]) -> np.ndarray:
    """
    Convert a ResumeInput into a float32 feature matrix (1 × n_features).

    Layout matches training exactly:
      [binary_skill_0, …, binary_skill_N,
       core_cov/100, opt_cov/100, proj/100, ats/100, struct/100]
    """
    # Binary skill vector
    skill_set   = set(s.lower().strip() for s in input_data.skills)
    vocab_index = {v: i for i, v in enumerate(vocabulary)}

    skill_vec = [0] * len(vocabulary)
    for skill in skill_set:
        idx = vocab_index.get(skill)
        if idx is not None:
            skill_vec[idx] = 1

    # Numeric features in exact training order, normalised to 0–1
    numeric = [
        getattr(input_data, field) / 100.0
        for field in _NUMERIC_FIELD_ORDER
    ]

    feature_vector = skill_vec + numeric
    return np.array([feature_vector], dtype=np.float32)


# ── Inference ─────────────────────────────────────────────────────────────────

def predict_resume(input_data) -> dict:
    """
    Full inference pipeline:

    1. Transform input → feature vector (matches training order)
    2. Predict role via RandomForestClassifier
    3. Extract max(predict_proba) as confidence
    4. Predict score via RandomForestRegressor
    5. Identify weak areas:
         • Primary: numeric features < 50 → labelled weak
         • Fallback: bottom-3 by feature importance from classifier

    Returns:
        {
            predicted_role:  str,
            confidence:      float,
            resume_score:    float,
            weak_areas:      list[str],
        }
    """
    vocabulary          = get_vocabulary()
    clf, label_encoder  = get_role_model()
    reg                 = get_score_model()
    meta                = get_metadata()

    # ── 1. Feature vector ──────────────────────────────────────────────────────
    X = transform_input(input_data, vocabulary)
    log.debug("Feature vector shape: %s, non-zero skills: %d",
              X.shape, int(X[0, :len(vocabulary)].sum()))

    # ── 2. Role prediction ─────────────────────────────────────────────────────
    role_enc       = clf.predict(X)[0]
    predicted_role = str(label_encoder.inverse_transform([role_enc])[0])

    # ── 3. Confidence ──────────────────────────────────────────────────────────
    probabilities = clf.predict_proba(X)[0]
    confidence    = float(np.max(probabilities))

    # ── 4. Score prediction ────────────────────────────────────────────────────
    raw_score    = float(reg.predict(X)[0])
    resume_score = round(clamp(raw_score), 1)

    # ── 5. Weak area detection ─────────────────────────────────────────────────
    weak_areas: list[str] = []

    for field in _NUMERIC_FIELD_ORDER:
        value = getattr(input_data, field)
        if value < _WEAK_THRESHOLD:
            weak_areas.append(_NUMERIC_DISPLAY_NAMES[field])

    # Fallback: use classifier feature importance when nothing is explicitly weak
    if not weak_areas:
        importances      = clf.feature_importances_
        n_skills         = len(vocabulary)
        numeric_imp      = importances[n_skills:]  # last 5 entries = numeric features

        # Sort ascending (lowest importance = most under-developed)
        ranked = sorted(
            zip(numeric_imp, _NUMERIC_FIELD_ORDER),
            key=lambda x: x[0],
        )
        weak_areas = [_NUMERIC_DISPLAY_NAMES[field] for _, field in ranked[:3]]

    log.debug("Prediction — role: %s  conf: %.2f  score: %.1f  weak: %s",
              predicted_role, confidence, resume_score, weak_areas)

    return {
        "predicted_role": predicted_role,
        "confidence":     round(confidence, 4),
        "resume_score":   resume_score,
        "weak_areas":     weak_areas[:3],
        "model_version":  meta.get("version", "2.0"),
    }
