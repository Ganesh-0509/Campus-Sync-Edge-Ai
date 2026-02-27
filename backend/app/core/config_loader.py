"""
config_loader.py — single source of truth for all configuration.

Responsibilities:
  - Read JSON config files from backend/config/
  - Validate structure and value constraints
  - Provide typed accessors: load_skills(), load_roles(), load_scoring()
  - validate_all() is called at server startup to fail fast on bad config
"""

import json
from pathlib import Path

CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config"

# ── Required keys ──────────────────────────────────────────────────────────────
_REQUIRED_WEIGHT_KEYS    = {"core", "optional", "project", "ats", "structure"}
_REQUIRED_THRESHOLD_KEYS = {"job_ready", "improving"}


# ── Internal helper ────────────────────────────────────────────────────────────

def _load_json(filename: str) -> dict:
    path = CONFIG_DIR / filename
    if not path.exists():
        raise FileNotFoundError(
            f"Missing config file: {path}\n"
            f"Create it inside the backend/config/ directory."
        )
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {filename}: {e}") from e


# ── Public loaders ─────────────────────────────────────────────────────────────

def load_skills() -> dict:
    """
    Load skills.json.

    Expected format::

        {
            "python":  ["python", "py"],
            "react":   ["react", "reactjs"]
        }

    Returns a dict mapping canonical_name → list[synonym].
    Raises ValueError if the structure is wrong.
    """
    data = _load_json("skills.json")

    if not isinstance(data, dict):
        raise ValueError("skills.json must be a JSON object.")

    for canonical, synonyms in data.items():
        if not isinstance(synonyms, list) or not all(isinstance(s, str) for s in synonyms):
            raise ValueError(
                f"skills.json: '{canonical}' must map to a list of strings, "
                f"got {type(synonyms).__name__}."
            )

    return data


def load_roles() -> dict:
    """
    Load roles.json.

    Expected format::

        {
            "Backend Developer": {
                "core":     ["python", "sql"],
                "optional": ["docker", "aws"]
            }
        }

    Returns a dict mapping role_name → {core, optional}.
    Raises ValueError if structure is wrong.
    """
    data = _load_json("roles.json")

    if not isinstance(data, dict):
        raise ValueError("roles.json must be a JSON object.")

    for role_name, role_data in data.items():
        if not isinstance(role_data, dict):
            raise ValueError(f"roles.json: '{role_name}' must be a JSON object.")
        for key in ("core", "optional"):
            if key not in role_data:
                raise ValueError(
                    f"roles.json: '{role_name}' is missing required key '{key}'."
                )
            if not isinstance(role_data[key], list):
                raise ValueError(
                    f"roles.json: '{role_name}.{key}' must be a list of strings."
                )

    return data


def load_scoring() -> dict:
    """
    Load scoring.json.

    Expected format::

        {
            "weights": {
                "core": 0.60, "optional": 0.15, "project": 0.15,
                "ats": 0.05, "structure": 0.05
            },
            "readiness_thresholds": {
                "job_ready": 75, "improving": 50
            }
        }

    Returns the full config dict.
    Raises ValueError if keys are missing.
    """
    data = _load_json("scoring.json")

    for top_key in ("weights", "readiness_thresholds"):
        if top_key not in data:
            raise ValueError(f"scoring.json: Missing top-level key '{top_key}'.")

    missing_w = _REQUIRED_WEIGHT_KEYS - set(data["weights"].keys())
    if missing_w:
        raise ValueError(f"scoring.json: Missing weight keys: {sorted(missing_w)}")

    missing_t = _REQUIRED_THRESHOLD_KEYS - set(data["readiness_thresholds"].keys())
    if missing_t:
        raise ValueError(f"scoring.json: Missing threshold keys: {sorted(missing_t)}")

    return data


# ── Startup validator ──────────────────────────────────────────────────────────

def validate_all() -> None:
    """
    Load and cross-validate ALL config files.
    Called once at server startup — fails loudly if anything is wrong.

    Checks:
      1. All files load and parse correctly.
      2. scoring.json weights sum ≤ 1.0.
      3. Every skill referenced in roles.json exists in skills.json.
    """
    print("🔍  Validating configuration files...", flush=True)

    skills  = load_skills()
    roles   = load_roles()
    scoring = load_scoring()

    # ── Check weight sum ──────────────────────────────────────────────────────
    weights    = scoring["weights"]
    weight_sum = sum(weights.values())
    if weight_sum > 1.0 + 1e-9:   # small float tolerance
        raise ValueError(
            f"scoring.json: Weights sum to {weight_sum:.4f} — must be ≤ 1.0.\n"
            f"Current weights: {weights}"
        )

    # ── Cross-validate role skills against skill dictionary ───────────────────
    canonical_set = set(skills.keys())
    for role_name, role_data in roles.items():
        all_role_skills = role_data["core"] + role_data["optional"]
        for skill in all_role_skills:
            if skill not in canonical_set:
                raise ValueError(
                    f"roles.json: Skill '{skill}' in role '{role_name}' "
                    f"does not exist in skills.json.\n"
                    f"Add '{skill}' to skills.json before using it in a role."
                )

    print(
        f"✅  Config valid — "
        f"{len(skills)} skills | {len(roles)} roles | "
        f"weights sum={weight_sum:.2f}",
        flush=True,
    )
