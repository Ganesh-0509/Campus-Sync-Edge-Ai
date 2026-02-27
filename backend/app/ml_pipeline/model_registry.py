"""
model_registry.py — persist and load the computed intelligence snapshot.

Saves hybrid_v1.json inside the ml_pipeline/ directory.
This file acts as a lightweight "model" cache, rebuilt on demand via
POST /ml/recompute-model.
"""

import json
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict

MODEL_PATH = Path(__file__).resolve().parent / "hybrid_v1.json"


def save_model(
    dataset_size:      int,
    skill_impact_data: dict,
    role_stats:        dict | None = None,
) -> dict:
    """
    Persist the intelligence snapshot to hybrid_v1.json.

    Stored fields:
      - version, updated_at, dataset_size
      - global_mean_score
      - skill_impact_ranking
      - role_stats (avg / min / max / count per role)
    """
    model = {
        "version":              "hybrid_v1",
        "updated_at":           datetime.now(timezone.utc).isoformat(),
        "dataset_size":         dataset_size,
        "global_mean_score":    skill_impact_data.get("global_mean_score", 0),
        "skill_impact_ranking": skill_impact_data.get("skill_impact_ranking", []),
        "role_stats":           role_stats or {},
    }

    with open(MODEL_PATH, "w", encoding="utf-8") as f:
        json.dump(model, f, indent=2)

    return model


def load_model() -> dict | None:
    """Load the cached model snapshot. Returns None if it does not exist."""
    if not MODEL_PATH.exists():
        return None
    with open(MODEL_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def model_exists() -> bool:
    return MODEL_PATH.exists()


def build_role_stats(records: list[dict]) -> dict:
    """Helper: compute avg / min / max / count per role from records."""
    buckets: dict = defaultdict(list)
    for r in records:
        buckets[r["role"]].append(r["final_score"])

    return {
        role: {
            "avg":   round(sum(s) / len(s), 1),
            "min":   min(s),
            "max":   max(s),
            "count": len(s),
        }
        for role, s in buckets.items()
    }
