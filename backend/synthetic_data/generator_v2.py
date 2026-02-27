"""
generator_v2.py — Synthetic Dataset v2 (high-ambiguity, realistic).

Key changes from v1:
  - Lower core skill probability (0.70–0.85) — more naturalistic gaps
  - Broader optional range (0.40–0.70) — more variance
  - Higher peripheral probability (0.20–0.35) — more noise
  - 2–5 cross-role skills per resume + 10% chance of 2 core skills from other role
  - Global generic skill pool (2–4 per resume)
  - 5% label noise via adjacent role mapping
  - Stratified project_score distribution (20/60/20 split)
  - Guaranteed: no perfectly clean resumes; ~10% miss 2+ core skills
"""

from __future__ import annotations
import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from synthetic_data.role_definitions import ROLE_DEFINITIONS, ROLE_NAMES
from app.services.scoring_engine import apply_locked_formula, get_readiness_category

# ── Generic skills injected into every resume ──────────────────────────────────
GENERIC_SKILL_POOL: list[str] = [
    "git", "linux", "sql", "debugging", "agile",
    "problem solving", "communication", "rest", "api", "testing",
]

# ── Adjacent role map for label noise ─────────────────────────────────────────
ADJACENT_ROLES: dict[str, str] = {
    "Frontend Developer":   "Full Stack Developer",
    "Backend Developer":    "Full Stack Developer",
    "Full Stack Developer":  "Backend Developer",
    "Data Scientist":       "ML Engineer",
    "ML Engineer":          "Data Scientist",
    "DevOps Engineer":      "Backend Developer",
}

# ── Probability bounds (v2 — more ambiguous) ──────────────────────────────────
CORE_PROB_RANGE       = (0.70, 0.85)
OPTIONAL_PROB_RANGE   = (0.40, 0.70)
PERIPHERAL_PROB_RANGE = (0.20, 0.35)


def _sample_project_score(rng: random.Random) -> int:
    """Stratified: 20% low (30–50), 60% mid (50–75), 20% high (75–95)."""
    r = rng.random()
    if r < 0.20:
        return rng.randint(30, 50)
    elif r < 0.80:
        return rng.randint(50, 75)
    else:
        return rng.randint(75, 95)


def generate_resume_v2(
    role_name:           str,
    rng:                 random.Random,
    force_miss_multiple: bool = False,
    apply_label_noise:   bool = False,
) -> dict:
    """
    Generate one synthetic v2 resume record.

    Args:
        role_name:           True target role (scoring always uses this).
        rng:                 Seeded Random instance.
        force_miss_multiple: If True, force removal of 2-3 core skills.
        apply_label_noise:   If True, swap output label to adjacent role.
    """
    role              = ROLE_DEFINITIONS[role_name]
    core_skills       = role["core"]
    optional_skills   = role["optional"]
    peripheral_skills = role["peripheral"]

    # ── Tiered skill sampling ─────────────────────────────────────────────────
    core_prob  = rng.uniform(*CORE_PROB_RANGE)
    opt_prob   = rng.uniform(*OPTIONAL_PROB_RANGE)
    peri_prob  = rng.uniform(*PERIPHERAL_PROB_RANGE)

    selected: set[str] = set()
    selected.update(s for s in core_skills       if rng.random() < core_prob)
    selected.update(s for s in optional_skills   if rng.random() < opt_prob)
    selected.update(s for s in peripheral_skills if rng.random() < peri_prob)

    # ── Cross-role contamination: 2–5 random skills ───────────────────────────
    other_roles = [r for r in ROLE_NAMES if r != role_name]
    num_cross   = rng.randint(2, 5)
    for _ in range(num_cross):
        donor = rng.choice(other_roles)
        pool  = (
            ROLE_DEFINITIONS[donor]["core"]
            + ROLE_DEFINITIONS[donor]["optional"]
            + ROLE_DEFINITIONS[donor]["peripheral"]
        )
        selected.add(rng.choice(pool))

    # ── 10% chance: 2 core skills from another role ───────────────────────────
    if rng.random() < 0.10:
        donor       = rng.choice(other_roles)
        donor_cores = ROLE_DEFINITIONS[donor]["core"]
        selected.update(rng.sample(donor_cores, min(2, len(donor_cores))))

    # ── Generic skill pool: inject 2–4 ───────────────────────────────────────
    num_generic = rng.randint(2, 4)
    selected.update(rng.sample(GENERIC_SKILL_POOL, num_generic))

    # ── Guarantee: no perfectly clean resume (must miss ≥1 core) ─────────────
    if selected.issuperset(set(core_skills)):
        selected.discard(rng.choice(core_skills))

    # ── Force 2–3 core skills missing (~10% of resumes) ──────────────────────
    if force_miss_multiple:
        core_present = [s for s in core_skills if s in selected]
        num_to_drop  = min(rng.randint(2, 3), len(core_present))
        if num_to_drop:
            for skill in rng.sample(core_present, num_to_drop):
                selected.discard(skill)

    detected_skills = sorted(selected)

    # ── Sub-scores ─────────────────────────────────────────────────────────────
    project_score_pct   = _sample_project_score(rng)
    ats_score_pct       = rng.randint(50, 100)
    structure_score_pct = rng.randint(40, 100)

    # ── Coverage (always computed against the TRUE role) ──────────────────────
    matched_core     = [s for s in core_skills     if s in selected]
    matched_optional = [s for s in optional_skills if s in selected]

    core_coverage     = len(matched_core)     / len(core_skills)     if core_skills     else 0.0
    optional_coverage = len(matched_optional) / len(optional_skills) if optional_skills else 0.0

    # ── Real deterministic scoring engine ─────────────────────────────────────
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

    # ── Label noise: 5% — swap output label to adjacent role ─────────────────
    output_role = ADJACENT_ROLES.get(role_name, role_name) if apply_label_noise else role_name

    return {
        "detected_skills":           detected_skills,
        "role":                      output_role,
        "final_score":               final_score,
        "readiness_category":        readiness_category,
        "core_coverage_percent":     int(core_coverage     * 100),
        "optional_coverage_percent": int(optional_coverage * 100),
        "project_score_percent":     project_score_pct,
        "ats_score_percent":         ats_score_pct,
        "structure_score_percent":   structure_score_pct,
        "missing_core_skills":       missing_core,
        "missing_optional_skills":   missing_optional,
        "data_type":                 "synthetic_v2",
    }


def generate_dataset_v2(count: int, rng: random.Random) -> list[dict]:
    """
    Generate *count* records with balanced role distribution.

    Distribution of controlled variance:
      10% — forced to miss 2+ core skills
       5% — label noise applied
    """
    per_role  = count // len(ROLE_NAMES)
    role_list: list[str] = []

    for role in ROLE_NAMES:
        role_list.extend([role] * per_role)

    remainder = count - len(role_list)
    role_list.extend(rng.choices(ROLE_NAMES, k=remainder))
    rng.shuffle(role_list)

    records = []
    for role in role_list:
        force_miss  = rng.random() < 0.10   # 10% miss 2+ core
        label_noise = rng.random() < 0.05   # 5% label swap
        records.append(generate_resume_v2(role, rng, force_miss, label_noise))

    return records
