"""
skill_dictionary.py — config-driven skill extraction.

Loads canonical skill → synonym list from config/skills.json at startup.
No hardcoded skill data; expand skills.json to add new skills.
"""

import re
from app.core.config_loader import load_skills

# ── Load once at startup (module-level cache) ──────────────────────────────────
_SKILL_DICT: dict = load_skills()

# ── Category mapping (structural, not business config) ─────────────────────────
_SKILL_CATEGORIES: dict[str, set] = {
    "programming": {
        "python", "javascript", "typescript", "java", "c++", "c",
        "golang", "rust", "matlab",
    },
    "ml_ai": {
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "scikit-learn", "opencv", "nlp", "computer vision", "transformers",
    },
    "backend": {
        "fastapi", "flask", "django", "node.js", "express", "spring boot", "api",
    },
    "frontend": {
        "react", "next.js", "html", "css", "tailwind", "redux",
    },
    "database": {
        "sql", "mongodb", "firebase", "supabase", "redis",
    },
    "tools": {
        "git", "docker", "kubernetes", "linux", "aws", "azure", "gcp",
    },
}


def extract_skills(text: str) -> list:
    """
    Return canonical skill names found in *text*.

    - Case-insensitive
    - Whole-word boundary matching (no fuzzy)
    - Synonyms resolved to canonical name from skills.json
    """
    text_lower = text.lower()
    found = []

    for canonical, synonyms in _SKILL_DICT.items():
        for synonym in synonyms:
            if re.search(r"\b" + re.escape(synonym) + r"\b", text_lower):
                found.append(canonical)
                break   # one match per canonical is enough

    return list(set(found))


def get_skill_category(skill: str) -> str:
    for category, skill_set in _SKILL_CATEGORIES.items():
        if skill in skill_set:
            return category
    return "other"


# ── Backward-compat alias (used by jd_matcher) ────────────────────────────────
def extract_skills_from_text(text: str) -> dict:
    skills = extract_skills(text)
    categories: dict = {}
    for skill in skills:
        cat = get_skill_category(skill)
        categories.setdefault(cat, []).append(skill)
    return {"skills": skills, "categories": categories, "skill_count": len(skills)}