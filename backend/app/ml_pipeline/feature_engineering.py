"""
feature_engineering.py — build feature matrix from raw records.

Pipeline:
  1. Build a global sorted skill vocabulary from all records.
  2. Binary-encode each record's detected_skills against the vocabulary.
  3. Append 5 normalised structural numeric features.
  4. Return X, y_role, y_score, sample_weights as plain lists.

No external libraries required beyond the standard library.
sklearn arrays are built in train.py.
"""

from __future__ import annotations

_NUMERIC_FIELDS = [
    "core_coverage_percent",
    "optional_coverage_percent",
    "project_score_percent",
    "ats_score_percent",
    "structure_score_percent",
]


# ── Vocabulary ─────────────────────────────────────────────────────────────────

def build_vocabulary(records: list[dict]) -> list[str]:
    """
    Collect every unique skill seen across all records and sort them.
    Sorting ensures a deterministic, reproducible feature order.
    """
    vocab: set[str] = set()
    for r in records:
        vocab.update(r["detected_skills"])
    return sorted(vocab)


# ── Feature matrix ─────────────────────────────────────────────────────────────

def build_feature_matrix(
    records:  list[dict],
    vocab:    list[str],
) -> tuple[list[list], list[str], list[int], list[float]]:
    """
    Encode all records into a feature matrix.

    Feature vector per record:
      [binary_skill_0, ..., binary_skill_N,
       core_cov/100, opt_cov/100, proj/100, ats/100, struct/100]

    Returns:
        X              — list of feature vectors (len = len(vocab) + 5)
        y_role         — list of role strings
        y_score        — list of final_score integers
        sample_weights — list of floats
    """
    vocab_index: dict[str, int] = {v: i for i, v in enumerate(vocab)}
    vocab_size = len(vocab)

    X:              list[list]  = []
    y_role:         list[str]   = []
    y_score:        list[int]   = []
    sample_weights: list[float] = []

    for r in records:
        # ── Binary skill vector ───────────────────────────────────────────────
        skill_vec = [0] * vocab_size
        for skill in r["detected_skills"]:
            idx = vocab_index.get(skill)
            if idx is not None:
                skill_vec[idx] = 1

        # ── Numeric structural features (normalised 0–1) ──────────────────────
        numeric = [
            r.get(field, 0) / 100.0
            for field in _NUMERIC_FIELDS
        ]

        X.append(skill_vec + numeric)
        y_role.append(r["role"])
        y_score.append(r["final_score"])
        sample_weights.append(r["sample_weight"])

    return X, y_role, y_score, sample_weights


# ── Convenience wrapper ────────────────────────────────────────────────────────

def engineer_features(
    records: list[dict],
) -> tuple[list[list], list[str], list[int], list[float], list[str]]:
    """
    One-shot: build vocabulary + feature matrix.

    Returns:
        X, y_role, y_score, sample_weights, vocab
    """
    vocab = build_vocabulary(records)
    X, y_role, y_score, weights = build_feature_matrix(records, vocab)

    print(
        f"🔧  Features engineered — "
        f"{len(records)} records × {len(vocab) + len(_NUMERIC_FIELDS)} features "
        f"({len(vocab)} skills + {len(_NUMERIC_FIELDS)} numeric)",
        flush=True,
    )
    return X, y_role, y_score, weights, vocab
