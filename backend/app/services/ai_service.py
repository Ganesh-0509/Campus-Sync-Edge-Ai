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
        """Provides dynamic market forecast with prioritize Bytez."""
        if self.bytez_key:
            return await bytez_service.get_market_forecast(role, missing_skills)
        if self.gemini_key:
            return await gemini_service.get_market_forecast(role, missing_skills)
        if self.openai_key:
            return await self._get_openai_forecast(role, missing_skills) or gemini_service._get_fallback(role, missing_skills)
        return gemini_service._get_fallback(role, missing_skills)

    async def get_study_materials(self, skill: str, existing_skills: str = "") -> Dict[str, Any]:
        """Provides study notes and concepts for a skill, with caching and personalization."""
        # 1. Check DB Cache
        cached = knowledge_service.get_cached_knowledge(skill, "study")
        if cached:
            return cached

        # 2. Call AI with personalization context
        if self.bytez_key:
            res = await bytez_service.get_study_materials(skill, existing_skills)
            # 3. Store in DB Cache for reuse across users
            if res and not res.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, res, "study")
            return res
        
        return {
            "skill": skill,
            "quick_summary": f"Fundamentals of {skill}.",
            "key_concepts": [{"title": "Basics", "description": "Core principles."}],
            "pro_tip": "Keep practicing.",
            "estimated_study_time": "30 mins"
        }

    async def generate_quiz(self, skill: str) -> Dict[str, Any]:
        """Generates a verification quiz for a skill, with caching."""
        # 1. Check DB Cache
        cached = knowledge_service.get_cached_knowledge(skill, "quiz")
        if cached:
            return cached

        # 2. Call AI
        if self.bytez_key:
            res = await bytez_service.generate_quiz(skill)
            # 3. Store in DB Cache
            if res and not res.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, res, "quiz")
            return res
            
        return {
            "skill": skill,
            "questions": [
                {
                    "id": 1, 
                    "question": f"Is {skill} important?", 
                    "options": ["Yes", "No", "Maybe", "I don't know"],
                    "correct_index": 0,
                    "explanation": "Of course it is."
                }
            ]
        }

    async def get_chat_response(self, skill: str, user_query: str, chat_history: list = [], context: str = "") -> str:
        """
        Study Hub AI Assistant. Helps user with doubts about a specific skill.
        """
        if not self.bytez_key:
            return "AI Chat assistant is currently unavailable. Please try again later."

        # Fetch cached material for more context
        material = knowledge_service.get_cached_knowledge(skill, "study")
        material_context = ""
        if material:
            material_context = f"\nOfficial Study Summary: {material.get('quick_summary', '')}"
            concepts = [c.get('title', '') for c in material.get('key_concepts', [])]
            if concepts:
                material_context += f"\nKey Topics covered: {', '.join(concepts)}"

        # Construct focus-mode prompt
        system_prompt = f"""
        You are a expert tutor for {skill}.
        Student Background: {context}
        {material_context}
        Goal: Bridge the gap for this role.
        Behavior: Be helpful, clear, and concise. Use examples related to {skill}.
        """

        messages = [
            {"role": "system", "content": system_prompt}
        ]
        # Include history
        messages.extend(chat_history[-5:]) # Last 5 messages for context
        messages.append({"role": "user", "content": user_query})

        try:
            # Bytez run
            result = bytez_service.model.run(messages)
            
            # Simple extraction
            output = ""
            if hasattr(result, 'output') and isinstance(result.output, dict):
                output = result.output.get('content', '')
            elif isinstance(result, dict):
                output = result.get("output", {}).get('content', '') if isinstance(result.get("output"), dict) else str(result.get("output", ""))
            else:
                output = str(result)
            
            return output
        except Exception as e:
            log.error(f"Chat failed: {e}")
            return "Sorry, I had trouble processing that question. Could you try rephrasing?"

    async def _get_openai_forecast(self, role: str, missing_skills: list) -> Optional[Dict[str, Any]]:
        """Fallback to OpenAI for forecast if Bytez/Gemini fail."""
        if not self.openai_key: return None
        skills_str = ", ".join(missing_skills[:3])
        prompt = f"Role: {role}. Missing: {skills_str}. Generate market growth % and source as JSON."
        try:
            import httpx
            async with httpx.AsyncClient(verify=False) as client:
                resp = await client.post(
                    self.openai_url,
                    headers={"Authorization": f"Bearer {self.openai_key}"},
                    json={"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}]}
                )
                if resp.status_code == 200:
                    content = resp.json()["choices"][0]["message"]["content"]
                    return json.loads(content)
        except: pass
        return None

ai_service = AIService()
