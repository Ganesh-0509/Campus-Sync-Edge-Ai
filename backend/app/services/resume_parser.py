import pdfplumber
from docx import Document
import io
import re

# Heading keywords that signal each section
SECTION_INDICATORS = {
    "skills": [
        "skills", "technical skills", "tech stack",
        "technologies", "core competencies", "key skills"
    ],
    "projects": [
        "projects", "academic projects", "personal projects",
        "experience", "work experience", "project experience"
    ],
    "education": [
        "education", "academic background", "qualifications",
        "academic qualifications", "academics"
    ],
    "links": [
        "github", "linkedin", "portfolio", "profiles", "social"
    ],
}


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def _extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs).strip()


def _clean_text(text: str) -> str:
    text = re.sub(r"\(cid:\d+\)", " ", text)   # PDF encoding artifacts
    text = re.sub(r"-\s+", "", text)            # broken hyphenated words
    text = re.sub(r"[ \t]+", " ", text)         # collapse spaces/tabs
    return text.strip()


def _extract_links(text: str) -> list:
    urls = re.findall(r"https?://\S+", text)
    # Catch bare linkedin / github URLs without http(s)
    for domain in ["linkedin.com", "github.com"]:
        for match in re.findall(rf"{re.escape(domain)}/\S+", text):
            full = f"https://{match}"
            if full not in urls:
                urls.append(full)
    return list(set(urls))


def _detect_sections(text: str) -> dict:
    """Split resume text into labelled sections by heading detection."""
    lines = text.split("\n")
    current_section = None
    section_content = {s: [] for s in SECTION_INDICATORS}

    for line in lines:
        stripped = line.strip()
        stripped_lower = stripped.lower()
        matched = None

        for section, indicators in SECTION_INDICATORS.items():
            if any(
                stripped_lower == kw or stripped_lower.startswith(kw)
                for kw in indicators
            ):
                matched = section
                break

        if matched:
            current_section = matched
        elif current_section and stripped:
            section_content[current_section].append(stripped)

    return {
        section: "\n".join(content).strip()
        for section, content in section_content.items()
        if content
    }


def parse_resume(file_bytes: bytes, filename: str) -> dict:
    """
    Parse a PDF or DOCX resume and return structured sections.

    Returns:
        {
            "raw_text": str,
            "skills_text": str,
            "projects_text": str,
            "education_text": str,
            "links": [str],
            "sections_detected": [str]
        }
    """
    fname = filename.lower()
    if fname.endswith(".pdf"):
        raw = _extract_text_from_pdf(file_bytes)
    elif fname.endswith(".docx"):
        raw = _extract_text_from_docx(file_bytes)
    else:
        raise ValueError("Unsupported format. Only PDF and DOCX are allowed.")

    raw = _clean_text(raw)
    sections = _detect_sections(raw)
    links = _extract_links(raw)

    sections_detected = list(sections.keys())
    if links and "links" not in sections_detected:
        sections_detected.append("links")

    return {
        "raw_text": raw,
        "skills_text": sections.get("skills", ""),
        "projects_text": sections.get("projects", ""),
        "education_text": sections.get("education", ""),
        "links": links,
        "sections_detected": sections_detected,
    }
