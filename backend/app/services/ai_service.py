import os
import json
import logging
import httpx
from typing import Optional, Dict, Any
from app.services.gemini_service import gemini_service
from app.services.bytez_service import bytez_service
from app.services.knowledge_service import knowledge_service

log = logging.getLogger("ai_service")


class AIService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.bytez_key = os.getenv("BYTEZ_API_KEY")
        self.openai_url = "https://api.openai.com/v1/chat/completions"

    async def get_market_forecast(self, role: str, missing_skills: list) -> Dict[str, Any]:
        """Market forecast — tries Bytez, then Gemini, then static fallback."""
        if self.bytez_key:
            return await bytez_service.get_market_forecast(role, missing_skills)
        if self.gemini_key:
            return await gemini_service.get_market_forecast(role, missing_skills)
        if self.openai_key:
            result = await self._get_openai_forecast(role, missing_skills)
            if result:
                return result
        return gemini_service._get_fallback(role, missing_skills)

    async def get_study_materials(self, skill: str, existing_skills: str = "") -> Dict[str, Any]:
        """
        Full RAG pipeline for study material generation.
        1. Redis cache -> 2. PGVector retrieval -> 3. LLM generation -> 4. Judge -> 5. Cache.
        Falls back to SQLite local cache, then bare Bytez if RAG is unavailable.
        """
        # 1. Try the full RAG pipeline (Redis + PGVector + Judge)
        try:
            from app.services.rag_service import generate_rag_tutorial
            result = await generate_rag_tutorial(
                skill=skill,
                existing_skills=existing_skills,
                model=bytez_service.model if self.bytez_key else None
            )
            if result and not result.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, result, "study")
                return result
        except Exception as e:
            log.warning("RAG pipeline error for [%s]: %s -- falling back to SQLite cache.", skill, e)

        # 2. SQLite local cache
        cached = knowledge_service.get_cached_knowledge(skill, "study")
        if cached:
            return cached

        # 3. Direct Bytez (no RAG, no cache)
        if self.bytez_key:
            res = await bytez_service.get_study_materials(skill, existing_skills)
            if res and not res.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, res, "study")
            return res

        return {
            "skill": skill,
            "quick_summary": f"Fundamentals of {skill}.",
            "key_concepts": [{"title": "Basics", "description": "Core principles."}],
            "pro_tip": "Keep practicing.",
            "estimated_study_time": "30 mins",
        }

    async def generate_quiz(self, skill: str) -> Dict[str, Any]:
        """Generates a quiz for a skill with local SQLite caching."""
        cached = knowledge_service.get_cached_knowledge(skill, "quiz")
        if cached:
            return cached

        if self.bytez_key:
            res = await bytez_service.generate_quiz(skill)
            if res and not res.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, res, "quiz")
            return res

        return {
            "skill": skill,
            "questions": [{
                "id": 1,
                "question": f"Is {skill} important?",
                "options": ["Yes", "No", "Maybe", "I don't know"],
                "correct_index": 0,
                "explanation": "Of course it is.",
            }],
        }

    async def get_chat_response(self, skill: str, user_query: str, chat_history: list = [], context: str = "") -> str:
        """Study Hub AI Assistant -- answers doubts about a specific skill."""
        if not self.bytez_key:
            return "AI Chat assistant is currently unavailable. Please try again later."

        material = knowledge_service.get_cached_knowledge(skill, "study")
        material_context = ""
        if material:
            material_context = f"\nStudy Summary: {material.get('quick_summary', '')}"
            for section in material.get("detailed_content", [])[:2]:
                material_context += f"\n- {section.get('subheading', '')}: {section.get('explanation', '')[:200]}"

        system_prompt = (
            f"You are a senior tutor specializing in {skill}.\n"
            f"Student Background: {context}\n"
            f"{material_context}\n"
            "Behavior: Be concise, accurate, and give code examples when relevant."
        )

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(chat_history[-5:])
        messages.append({"role": "user", "content": user_query})

        try:
            result = bytez_service.model.run(messages)
            output = ""
            if hasattr(result, "output") and isinstance(result.output, dict):
                output = result.output.get("content", "")
            elif isinstance(result, dict):
                output = result.get("output", {}).get("content", "") if isinstance(result.get("output"), dict) else str(result.get("output", ""))
            else:
                output = str(result)
            return output
        except Exception as e:
            log.error("Chat failed: %s", e)
            return "Sorry, I couldn't process that. Could you rephrase?"

    async def _get_openai_forecast(self, role: str, missing_skills: list) -> Optional[Dict[str, Any]]:
        """Fallback to OpenAI for market forecasting."""
        if not self.openai_key:
            return None
        skills_str = ", ".join(missing_skills[:3])
        prompt = f"Role: {role}. Missing skills: {skills_str}. Return JSON: {{trend_title, growth_pct, summary, sources}}"
        try:
            async with httpx.AsyncClient(verify=False) as client:
                resp = await client.post(
                    self.openai_url,
                    headers={"Authorization": f"Bearer {self.openai_key}"},
                    json={"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}]},
                )
                if resp.status_code == 200:
                    content = resp.json()["choices"][0]["message"]["content"]
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    return json.loads(content)
        except Exception as e:
            log.error("OpenAI forecast failed: %s", e)
        return None


ai_service = AIService()
