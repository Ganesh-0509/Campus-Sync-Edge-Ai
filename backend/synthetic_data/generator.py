"""
generator.py — stochastic synthetic resume generator.

Uses the REAL deterministic scoring engine for all score computation.
All randomness is channelled through a seeded Random instance —
no calls to random.random() directly so the dataset is reproducible.

Sampling probabilities per tier:
  core:       0.85 – 0.95
  optional:   0.45 – 0.65
  peripheral: 0.10 – 0.25
"""

import random
import sys
import os

# Allow imports from backend/ root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from synthetic_data.role_definitions import ROLE_DEFINITIONS, ROLE_NAMES
from app.services.scoring_engine import apply_locked_formula, get_readiness_category


# ── Probability bounds ─────────────────────────────────────────────────────────
CORE_PROB_RANGE       = (0.85, 0.95)
OPTIONAL_PROB_RANGE   = (0.45, 0.65)
PERIPHERAL_PROB_RANGE = (0.10, 0.25)


def _sample_skills(
    skill_list: list[str],
    prob:       float,
    rng:        random.Random,
) -> list[str]:
    """Include each skill independently with probability *prob*."""
    return [s for s in skill_list if rng.random() < prob]


def _cross_role_skills(
    exclude_role: str,
    rng:          random.Random,
    n:            int = None,
) -> list[str]:
    """Pick 1–3 random skills from OTHER roles (noise injection)."""
    if n is None:
        n = rng.randint(1, 3)
    other_roles = [r for r in ROLE_NAMES if r != exclude_role]
    picked = []
    for _ in range(n):
        donor     = rng.choice(other_roles)
        pool      = ROLE_DEFINITIONS[donor]["core"] + ROLE_DEFINITIONS[donor]["optional"]
        picked.append(rng.choice(pool))
    return picked


def generate_resume(
    role_name:        str,
    rng:              random.Random,
    force_miss_core:  bool = False,
) -> dict:
    """
    Generate one synthetic resume record for *role_name*.

    Args:
        role_name:       Target role.
        rng:             Seeded Random instance for reproducibility.
        force_miss_core: If True, ensure at least 1 core skill is absent.

    Returns a dict ready for Supabase insertion.
    """
    role            = ROLE_DEFINITIONS[role_name]
    core_skills     = role["core"]
    optional_skills = role["optional"]
    peripheral_skills = role["peripheral"]

    # ── Skill sampling ─────────────────────────────────────────────────────────
    core_prob  = rng.uniform(*CORE_PROB_RANGE)
    opt_prob   = rng.uniform(*OPTIONAL_PROB_RANGE)
    peri_prob  = rng.uniform(*PERIPHERAL_PROB_RANGE)

    selected: set[str] = set()
    selected.update(_sample_skills(core_skills,       core_prob,  rng))
    selected.update(_sample_skills(optional_skills,   opt_prob,   rng))
    selected.update(_sample_skills(peripheral_skills, peri_prob,  rng))

    # ── Cross-role noise ───────────────────────────────────────────────────────
    selected.update(_cross_role_skills(role_name, rng))

    # ── Guarantee: never have all core + all optional ─────────────────────────
    if selected.issuperset(core_skills) and selected.issuperset(optional_skills):
        skill_to_drop = rng.choice(optional_skills)
        selected.discard(skill_to_drop)

    # ── Force 15% miss at least 1 core skill ─────────────────────────────────
    if force_miss_core:
        core_present = [s for s in core_skills if s in selected]
        if core_present:                               # might already miss one
            selected.discard(rng.choice(core_present))

    detected_skills = sorted(selected)                 # deterministic order

    # ── Random sub-scores (ranges per spec) ───────────────────────────────────
    project_score_pct   = rng.randint(30, 90)
    ats_score_pct       = rng.randint(60, 100)
    structure_score_pct = rng.randint(50, 100)

    # ── Coverage (computed from actual selected skills) ───────────────────────
    matched_core     = [s for s in core_skills     if s in selected]
    matched_optional = [s for s in optional_skills if s in selected]

    core_coverage     = len(matched_core)     / len(core_skills)     if core_skills     else 0.0
    optional_coverage = len(matched_optional) / len(optional_skills) if optional_skills else 0.0

    # ── Real scoring engine (locked formula) ─────────────────────────────────
    final_score = apply_locked_formula(
        core_coverage       = core_coverage,
        optional_coverage   = optional_coverage,
        project_score_raw   = project_score_pct   / 100,
        ats_score_raw       = ats_score_pct       / 100,
        structure_score_raw = structure_score_pct / 100,
    )
    readiness_category = get_readiness_category(final_score)

    missing_core     = [s for s in core_skills     if s not in selected]
    missing_optional = [s for s in optional_skills if s not in selected]

    return {
        "detected_skills":           detected_skills,
        "role":                      role_name,
        "final_score":               final_score,
        "readiness_category":        readiness_category,
        "core_coverage_percent":     int(core_coverage     * 100),
        "optional_coverage_percent": int(optional_coverage * 100),
        "project_score_percent":     project_score_pct,
        "ats_score_percent":         ats_score_pct,
        "structure_score_percent":   structure_score_pct,
        "missing_core_skills":       missing_core,
        "missing_optional_skills":   missing_optional,
        "data_type":                 "synthetic",
    }


def generate_dataset(
    count: int,
    rng:   random.Random,
) -> list[dict]:
    """
    Generate *count* records with balanced role distribution.

    Exactly (count // 6) records per role, remainder spread randomly.
    15% of records are forced to miss at least 1 core skill.
    """
    per_role = count // len(ROLE_NAMES)
    role_list: list[str] = []

    for role in ROLE_NAMES:
        role_list.extend([role] * per_role)

    # Fill remainder
    remainder = count - len(role_list)
    role_list.extend(rng.choices(ROLE_NAMES, k=remainder))

    # Shuffle for realism
    rng.shuffle(role_list)

    records = []
    for i, role in enumerate(role_list):
        force_miss = (rng.random() < 0.15)
        records.append(generate_resume(role, rng, force_miss_core=force_miss))

    return records
