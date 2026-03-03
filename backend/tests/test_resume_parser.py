"""
test_resume_parser.py — unit tests for resume parsing helpers.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.resume_parser import _clean_text, _extract_links, _detect_sections


class TestCleanText:
    def test_removes_cid_artifacts(self):
        assert "(cid:123)" not in _clean_text("Hello (cid:123) World")

    def test_collapses_spaces(self):
        assert _clean_text("too   many    spaces") == "too many spaces"

    def test_joins_hyphenated_words(self):
        assert _clean_text("hyper-\n  text") == "hypertext"

    def test_collapses_excessive_newlines(self):
        result = _clean_text("line1\n\n\n\n\nline2")
        assert result.count("\n") <= 2


class TestExtractLinks:
    def test_finds_https_urls(self):
        text = "Visit https://github.com/user/repo for code"
        links = _extract_links(text)
        assert any("github.com" in l for l in links)

    def test_finds_bare_github(self):
        text = "Check github.com/user/repo"
        links = _extract_links(text)
        assert any("github.com" in l for l in links)

    def test_no_duplicates(self):
        text = "https://linkedin.com/in/user linkedin.com/in/user"
        links = _extract_links(text)
        # Should not have duplicates
        assert len(links) == len(set(links))


class TestDetectSections:
    def test_detects_skills_section(self):
        text = "SKILLS\nPython, React, SQL\n\nEDUCATION\nB.Tech CS"
        sections = _detect_sections(text)
        assert "skills" in sections
        assert "Python" in sections["skills"]

    def test_detects_education(self):
        text = "Education:\nB.Tech Computer Science\nXYZ University"
        sections = _detect_sections(text)
        assert "education" in sections

    def test_handles_uppercase_headings(self):
        text = "TECHNICAL SKILLS\nJava, Docker"
        sections = _detect_sections(text)
        assert "skills" in sections

    def test_handles_colon_inline(self):
        text = "Skills: Python, Java, React"
        sections = _detect_sections(text)
        assert "skills" in sections
        assert "Python" in sections["skills"]

    def test_empty_text(self):
        sections = _detect_sections("")
        assert len(sections) == 0
