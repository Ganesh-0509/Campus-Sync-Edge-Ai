"""
rag_service.py — Retrieval-Augmented Generation engine.

Pipeline:
  1. On cold start, check if knowledge_chunks table has data.
  2. For study material requests:
     a. Try Redis cache first (Phase 2 cache layer).
     b. If miss → embed the query via OpenAI text-embedding-3-small.
     c. Call match_knowledge() Supabase RPC to retrieve top-5 relevant chunks.
     d. Inject retrieved context into structured LLM prompt.
     e. Run judge validation pass.
     f. Store in Redis cache with 24h TTL.
  3. Return structured tutorial with source citations.
"""

import os
import json
import logging
import hashlib
from typing import List, Dict, Any, Optional

log = logging.getLogger("rag_service")

# ── Optional Redis ────────────────────────────────────────────────────────────
try:
    import redis as redis_lib
    _redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    _redis: Optional[redis_lib.Redis] = redis_lib.Redis.from_url(_redis_url, decode_responses=True, socket_connect_timeout=2)
    _redis.ping()
    log.info("Redis connected at %s", _redis_url)
except Exception as e:
    log.warning("Redis unavailable — caching disabled: %s", e)
    _redis = None


# ── Supabase client ────────────────────────────────────────────────────────────
def _get_sb():
    from app.core.supabase_client import get_supabase
    return get_supabase()


# ── OpenAI Embeddings ─────────────────────────────────────────────────────────
def embed_text(text: str) -> Optional[List[float]]:
    """Embed a string using OpenAI text-embedding-3-small (1536 dims)."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        log.warning("OPENAI_API_KEY not set — embedding unavailable.")
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        resp = client.embeddings.create(model="text-embedding-3-small", input=text)
        return resp.data[0].embedding
    except Exception as e:
        log.error("Embedding failed: %s", e)
        return None


# ── Vector Retrieval ──────────────────────────────────────────────────────────
def retrieve_context(query: str, match_count: int = 5) -> List[Dict[str, Any]]:
    """
    Embed the query and retrieve top-k similar chunks from PGVector.
    Returns list of {topic, content, similarity} dicts.
    Falls back to [] if Supabase or OpenAI are unavailable.
    """
    embedding = embed_text(query)
    if embedding is None:
        return []

    try:
        sb = _get_sb()
        resp = sb.rpc(
            "match_knowledge",
            {"query_embedding": embedding, "match_count": match_count}
        ).execute()
        return resp.data or []
    except Exception as e:
        log.error("Vector retrieval failed: %s", e)
        return []


# ── Redis Cache ────────────────────────────────────────────────────────────────
def _cache_key(skill: str, content_type: str = "tutorial") -> str:
    normalized = hashlib.md5(skill.lower().strip().encode()).hexdigest()[:8]
    return f"campussync:{content_type}:{normalized}:{skill.lower().strip()}"


def _cache_get(key: str) -> Optional[Dict]:
    if _redis is None:
        return None
    try:
        raw = _redis.get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        log.warning("Cache read error: %s", e)
        return None


def _cache_set(key: str, value: Dict, ttl_seconds: int = 86400):
    if _redis is None:
        return
    try:
        _redis.setex(key, ttl_seconds, json.dumps(value))
    except Exception as e:
        log.warning("Cache write error: %s", e)


# ── Judge Model ───────────────────────────────────────────────────────────────
async def _judge_content(reference: str, generated: str, model) -> str:
    """
    Asks the LLM to verify that generated content doesn't contradict the reference.
    Returns: 'valid', 'minor_inconsistency', or 'major_contradiction'.
    """
    if not model:
        return "valid"

    judge_prompt = f"""
You are a technical fact-checker.

REFERENCE MATERIAL:
{reference[:1500]}

GENERATED CONTENT:
{generated[:1500]}

Does the generated content contradict the reference material?
Return ONLY ONE of these exact strings: valid | minor_inconsistency | major_contradiction
"""
    try:
        res = model.run([{"role": "user", "content": judge_prompt}])
        content = ""
        if isinstance(res, dict):
            content = res.get("output", {}).get("content", "") if isinstance(res.get("output"), dict) else str(res.get("output", ""))
        elif hasattr(res, "output"):
            content = res.output.get("content", "") if isinstance(res.output, dict) else str(res.output)
        else:
            content = str(res)
        content = content.strip().lower()
        if "major" in content:
            return "major_contradiction"
        if "minor" in content:
            return "minor_inconsistency"
        return "valid"
    except Exception as e:
        log.error("Judge failed: %s", e)
        return "valid"


# ── RAG Study Material Generator ──────────────────────────────────────────────
async def generate_rag_tutorial(skill: str, existing_skills: str = "", model=None) -> Dict[str, Any]:
    """
    Full RAG pipeline:
    1. Redis cache check.
    2. PGVector retrieval.
    3. Structured prompt generation.
    4. Judge validation (regenerate once if major contradiction).
    5. Cache and return with citations.
    """
    cache_key = _cache_key(skill, "tutorial")

    # Step 1 — Redis cache hit
    cached = _cache_get(cache_key)
    if cached:
        log.info("Cache HIT for [%s]", skill)
        cached["_cache_hit"] = True
        return cached

    log.info("Cache MISS for [%s] — running RAG pipeline.", skill)

    # Step 2 — Retrieve context from knowledge base
    chunks = retrieve_context(skill)
    sources = [
        {"title": c.get("topic", skill), "source_type": "Curated Knowledge Base", "version": "v1.0", "similarity": round(c.get("similarity", 0), 3)}
        for c in chunks
    ]
    retrieved_text = "\n\n---\n\n".join([c.get("content", "") for c in chunks]) if chunks else ""

    # Build prompt
    reference_block = f"Use ONLY this verified reference material:\n\n{retrieved_text}\n\nDo NOT hallucinate beyond reference." if retrieved_text else f"Skill: {skill}. Student knows: [{existing_skills}]."

    prompt = f"""
You are a senior interview curriculum architect.

{reference_block}

Generate a structured, interview-focused tutorial JSON for: {skill}
Student already knows: [{existing_skills}]

Return this exact JSON format:
{{
  "skill": "{skill}",
  "quick_summary": "...",
  "estimated_study_time": "...",
  "sub_roadmap": [{{"title": "Topic", "duration": "Time"}}],
  "detailed_content": [
    {{
      "subheading": "1. Concept Foundation",
      "explanation": "Detailed explanation...",
      "algorithm": "Step 1: ...\\nStep 2: ...",
      "example": "code or analogy...",
      "complexity": "Time: O(n), Space: O(1)"
    }}
  ],
  "pro_tip": "industry tip...",
  "sources": []
}}

Produce at least 5-7 detailed_content sections covering:
1. Concept Foundation
2. Core Theory
3. Internal Working
4. Implementation
5. Interview Focus
6. Advanced Insight
7. Practice Problems
"""

    # Step 3 — LLM generation (with model fallback)
    result = None
    if model:
        try:
            res = model.run([{"role": "user", "content": prompt}])
            content = ""
            if isinstance(res, dict):
                content = res.get("output", {}).get("content", "") if isinstance(res.get("output"), dict) else str(res.get("output", ""))
            elif hasattr(res, "output"):
                content = res.output.get("content", "") if isinstance(res.output, dict) else str(res.output)
            else:
                content = str(res)

            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
        except Exception as e:
            log.error("RAG LLM generation failed: %s", e)

    if result is None:
        return {"skill": skill, "is_fallback": True, "sources": sources}

    # Step 4 — Judge validation
    if retrieved_text:
        verdict = await _judge_content(retrieved_text, json.dumps(result.get("detailed_content", [])), model)
        result["_judge_verdict"] = verdict

        # Regenerate once if major contradiction detected
        if verdict == "major_contradiction":
            log.warning("Judge detected major contradiction for [%s] — regenerating...", skill)
            try:
                res2 = model.run([{"role": "user", "content": prompt}])
                content2 = ""
                if isinstance(res2, dict):
                    content2 = res2.get("output", {}).get("content", "") if isinstance(res2.get("output"), dict) else str(res2.get("output", ""))
                elif hasattr(res2, "output"):
                    content2 = res2.output.get("content", "") if isinstance(res2.output, dict) else str(res2.output)
                else:
                    content2 = str(res2)

                if "```json" in content2:
                    content2 = content2.split("```json")[1].split("```")[0].strip()
                result = json.loads(content2)
                result["_judge_verdict"] = "regenerated"
            except Exception as e:
                log.error("Regeneration failed: %s", e)

    # Step 5 — Attach citations
    result["sources"] = sources if sources else [
        {"title": skill, "source_type": "AI Generated", "version": "gemini-2.5-flash-lite"}
    ]

    # Step 6 — Cache in Redis
    _cache_set(cache_key, result)

    return result
