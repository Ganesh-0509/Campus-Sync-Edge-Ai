"""
test_scoring_engine.py — unit tests for the scoring formula and readiness classification.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.scoring_engine import (
    calculate_structure_score,
    apply_locked_formula,
    get_readiness_category,
    weighted_coverage,
)


class TestStructureScore:
    def test_all_sections_detected(self):
        result = calculate_structure_score(["skills", "projects", "education", "links"])
        assert result["structure_score_percent"] == 100
        assert result["structure_score_raw"] == 1.0

    def test_no_sections_detected(self):
        result = calculate_structure_score([])
        assert result["structure_score_percent"] == 0
        assert result["structure_score_raw"] == 0.0

    def test_partial_sections(self):
        result = calculate_structure_score(["skills", "education"])
        assert result["structure_score_percent"] == 50


class TestLockedFormula:
    def test_perfect_resume(self):
        score = apply_locked_formula(1.0, 1.0, 1.0, 1.0, 1.0)
        assert score == 100

    def test_zero_resume(self):
        score = apply_locked_formula(0.0, 0.0, 0.0, 0.0, 0.0)
        assert score == 0

    def test_core_dominant(self):
        """Core skills should dominate the score (60% weight)"""
        with_core = apply_locked_formula(1.0, 0.0, 0.0, 0.0, 0.0)
        without_core = apply_locked_formula(0.0, 1.0, 0.0, 0.0, 0.0)
        assert with_core > without_core

    def test_score_capped_at_100(self):
        score = apply_locked_formula(1.0, 1.0, 1.0, 1.0, 1.0)
        assert score <= 100


class TestReadinessCategory:
    def test_job_ready(self):
        assert get_readiness_category(75) == "Job Ready"
        assert get_readiness_category(100) == "Job Ready"

    def test_improving(self):
        assert get_readiness_category(50) == "Improving"
        assert get_readiness_category(74) == "Improving"

    def test_needs_development(self):
        assert get_readiness_category(0) == "Needs Development"
        assert get_readiness_category(49) == "Needs Development"


class TestWeightedCoverage:
    def test_empty_pool(self):
        assert weighted_coverage([], []) == 0.0

    def test_all_matched(self):
        result = weighted_coverage(["python", "sql"], ["python", "sql"])
        assert result > 0.9

    def test_none_matched(self):
        result = weighted_coverage([], ["python", "sql"])
        assert result == 0.0

    def test_high_importance_skills_weight_more(self):
        """DSA is weighted 1.5× — matching it should give more coverage
        than matching an unweighted skill."""
        # Two pools: one with a high-importance skill, one without
        cov_high = weighted_coverage(["dsa"], ["dsa", "figma"])
        cov_low = weighted_coverage(["figma"], ["dsa", "figma"])
        # dsa is 1.5×, figma is 0.7× → dsa contributes more
        assert cov_high > cov_low
