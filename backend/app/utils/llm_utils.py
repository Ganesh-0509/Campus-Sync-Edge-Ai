"""
llm_utils.py — shared helpers for extracting and parsing LLM responses.

Eliminates duplication across rag_service.py, gemini_service.py, etc.
"""

import json
import logging
from typing import Any, Optional

log = logging.getLogger("llm_utils")


def extract_content(response: Any) -> str:
    """
    Extract text content from an LLM response object.
    Handles dict, object-with-output, and raw string formats.
    """
    if isinstance(response, dict):
        output = response.get("output", "")
        if isinstance(output, dict):
            return output.get("content", "")
        return str(output)
    if hasattr(response, "output"):
        output = response.output
        if isinstance(output, dict):
            return output.get("content", "")
        return str(output)
    return str(response)


def parse_json_from_llm(text: str) -> Optional[dict]:
    """
    Extract JSON from LLM output that may be wrapped in code fences.
    Returns parsed dict or None if parsing fails.
    """
    try:
        # Strip code fences
        cleaned = text
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

        return json.loads(cleaned)
    except (json.JSONDecodeError, IndexError) as e:
        log.warning("JSON parse failed: %s", e)
        return None
