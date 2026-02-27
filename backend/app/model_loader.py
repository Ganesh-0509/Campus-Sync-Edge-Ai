"""
model_loader.py — load and cache v2 ML artefacts at application startup.

Design rules:
  - Models are loaded ONCE into module-level singletons.
  - NO retraining. NO model mutation. Pure read-only after startup.
  - If any file is missing → descriptive RuntimeError (stops the server).
  - All accessors verify _loaded state before returning.

Uses standard pickle (same format as training pipeline).
"""

from __future__ import annotations
import json
import logging
import pickle
from pathlib import Path

log = logging.getLogger("model_loader")

_MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

# ── Module-level singletons (populated once at startup) ────────────────────────
_role_model:    object        = None   # RandomForestClassifier
_label_encoder: object        = None   # sklearn LabelEncoder
_score_model:   object        = None   # RandomForestRegressor
_vocabulary:    list[str]     = None   # sorted skill vocab
_metadata:      dict          = None   # metadata_v2.json
_loaded:        bool          = False


def load_models() -> None:
    """
    Load all v2 artefacts from backend/models/.
    Idempotent — safe to call multiple times (no-op after first load).

    Raises RuntimeError if any required file is missing.
    """
    global _role_model, _label_encoder, _score_model, _vocabulary, _metadata, _loaded

    if _loaded:
        return

    required = {
        "role_model_v2.pkl":   _MODELS_DIR / "role_model_v2.pkl",
        "score_model_v2.pkl":  _MODELS_DIR / "score_model_v2.pkl",
        "vocabulary_v2.pkl":   _MODELS_DIR / "vocabulary_v2.pkl",
        "metadata_v2.json":    _MODELS_DIR / "metadata_v2.json",
    }

    missing = [name for name, path in required.items() if not path.exists()]
    if missing:
        raise RuntimeError(
            f"Cannot start ML inference API — missing model files: {missing}\n"
            f"Train the models first:\n"
            f"  python -m app.ml_pipeline.train_v2 --seed 42"
        )

    # ── Role classifier ───────────────────────────────────────────────────────
    with open(required["role_model_v2.pkl"], "rb") as f:
        role_bundle    = pickle.load(f)
        _role_model    = role_bundle["model"]
        _label_encoder = role_bundle["label_encoder"]

    # ── Score regressor ───────────────────────────────────────────────────────
    with open(required["score_model_v2.pkl"], "rb") as f:
        _score_model = pickle.load(f)

    # ── Vocabulary ────────────────────────────────────────────────────────────
    with open(required["vocabulary_v2.pkl"], "rb") as f:
        _vocabulary = pickle.load(f)

    # ── Metadata ──────────────────────────────────────────────────────────────
    with open(required["metadata_v2.json"], "r", encoding="utf-8") as f:
        _metadata = json.load(f)

    _loaded = True

    log.info("=" * 55)
    log.info("  ML Models loaded (v%s)", _metadata.get("version", "?"))
    log.info("  Trained on : %d records (%d real, %d synthetic)",
             _metadata.get("trained_on_records", 0),
             _metadata.get("real_records", 0),
             _metadata.get("synthetic_records", 0))
    log.info("  Accuracy   : %.1f%%   F1: %.4f",
             _metadata.get("accuracy", 0) * 100,
             _metadata.get("f1_macro", 0))
    log.info("  RMSE       : %.4f    R2: %.4f",
             _metadata.get("rmse", 0),
             _metadata.get("r2", 0))
    log.info("  Vocabulary : %d skills", len(_vocabulary))
    log.info("  Trained    : %s", _metadata.get("date_trained", "unknown"))
    log.info("=" * 55)


# ── Accessors (raise if called before load_models()) ──────────────────────────

def _assert_loaded(fn_name: str) -> None:
    if not _loaded:
        raise RuntimeError(
            f"{fn_name}() called before models are loaded. "
            "load_models() must be called at startup."
        )


def get_role_model() -> tuple:
    """Returns (RandomForestClassifier, LabelEncoder)."""
    _assert_loaded("get_role_model")
    return _role_model, _label_encoder


def get_score_model():
    """Returns RandomForestRegressor."""
    _assert_loaded("get_score_model")
    return _score_model


def get_vocabulary() -> list[str]:
    _assert_loaded("get_vocabulary")
    return _vocabulary


def get_metadata() -> dict:
    _assert_loaded("get_metadata")
    return _metadata


def is_loaded() -> bool:
    return _loaded
