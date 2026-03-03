"""
test_skill_dictionary.py — unit tests for skill extraction and normalisation.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.skill_dictionary import (
    extract_skills, get_skill_category, normalize_skill, extract_skills_from_text
)


class TestExtractSkills:
    def test_basic_extraction(self):
        text = "I know Python, React, and SQL"
        skills = extract_skills(text)
        assert "python" in skills
        assert "react" in skills
        assert "sql" in skills

    def test_synonym_resolution(self):
        """Synonyms like 'reactjs' should resolve to canonical 'react'"""
        text = "Experience with ReactJS and NodeJS"
        skills = extract_skills(text)
        assert "react" in skills
        assert "node.js" in skills

    def test_case_insensitive(self):
        text = "PYTHON JavaScript TypeScript"
        skills = extract_skills(text)
        assert "python" in skills
        assert "javascript" in skills
        assert "typescript" in skills

    def test_no_false_matches(self):
        text = "I am a good person with communication skills"
        skills = extract_skills(text)
        # Should not match "c" from "communication" or similar false positives
        assert "c" not in skills

    def test_multiword_skills(self):
        text = "Familiar with machine learning and deep learning"
        skills = extract_skills(text)
        assert "machine learning" in skills
        assert "deep learning" in skills

    def test_abbreviations(self):
        text = "CI/CD pipeline with K8s and AWS"
        skills = extract_skills(text)
        assert "ci/cd" in skills
        assert "kubernetes" in skills
        assert "aws" in skills

    def test_empty_text(self):
        assert extract_skills("") == []


class TestNormalizeSkill:
    def test_exact_canonical(self):
        assert normalize_skill("python") == "python"
        assert normalize_skill("React") == "react"

    def test_synonym_to_canonical(self):
        assert normalize_skill("reactjs") == "react"
        assert normalize_skill("k8s") == "kubernetes"
        assert normalize_skill("sklearn") == "scikit-learn"

    def test_fuzzy_match_typo(self):
        # "pythn" is 1 edit distance from "python"
        assert normalize_skill("pythn") == "python"

    def test_unknown_skill_returned_as_is(self):
        result = normalize_skill("somethingCompletelyNewXYZ123")
        assert result == "somethingcompletelynewxyz123"


class TestGetSkillCategory:
    def test_programming(self):
        assert get_skill_category("python") == "programming"
        assert get_skill_category("java") == "programming"

    def test_ml_ai(self):
        assert get_skill_category("machine learning") == "ml_ai"
        assert get_skill_category("pytorch") == "ml_ai"

    def test_tools(self):
        assert get_skill_category("docker") == "tools"
        assert get_skill_category("kubernetes") == "tools"

    def test_other(self):
        assert get_skill_category("unknown_skill_xyz") == "other"


class TestExtractSkillsFromText:
    def test_returns_skills_and_categories(self):
        text = "Python, React, SQL, Docker"
        result = extract_skills_from_text(text)
        assert "skills" in result
        assert "categories" in result
        assert "skill_count" in result
        assert result["skill_count"] == len(result["skills"])
