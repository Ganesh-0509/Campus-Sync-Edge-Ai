import os
import logging
from typing import Dict, Any, List
import json

log = logging.getLogger("ai_service")

class BytezService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = None
        if api_key:
            try:
                # Based on the user's snippet
                import bytez
                self.sdk = bytez.Bytez(api_key)
                self.model = self.sdk.model(os.getenv("BYTEZ_MODEL", "google/gemini-2.5-flash-lite"))
            except Exception as e:
                log.error(f"Failed to initialize Bytez SDK: {e}")

    async def _get_scraped_context(self, skill: str) -> str:
        """Dynamically scrapes trusted sources to ground the AI model."""
        context = ""
        try:
            import wikipedia
            results = wikipedia.search(f"{skill} programming algorithm data structure", results=1)
            if results:
                page = wikipedia.page(results[0], auto_suggest=False)
                context = f"Source: Wikipedia\nTitle: {page.title}\n{page.summary}\n{page.content[:2000]}"
                return context
        except Exception as e:
            log.warning(f"Wiki scrape failed for {skill}: {e}")
            
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(f"{skill} programming tutorial facts", max_results=3))
                if results:
                    context = "Source: Web Search Snippets\n"
                    for res in results:
                        context += f"Snippet: {res.get('body', '')}\n\n"
                    return context
        except Exception as e:
            log.warning(f"DDG scrape failed for {skill}: {e}")
            
        return ""

    async def get_study_materials(self, skill: str, existing_skills: str = "") -> Dict[str, Any]:
        """Provides personalized study materials for a skill."""
        if not self.model:
            return {"skill": skill, "is_fallback": True}

        scraped_data = await self._get_scraped_context(skill)
        context_prompt = f"\n\nBase your educational material strictly on this trusted external data to avoid hallucinations:\n{scraped_data}\n" if scraped_data else ""

        prompt = f"""
        Expert Tutor Role.
        Create a comprehensive AI study guide and mini-course for: {skill}.
        Student already knows: [{existing_skills}].
        
        You must generate a detailed reading material that explains the topic with subheadings, detailed notes, step-by-step algorithms, and code examples for each subheading until the topic is well explained. Mimic the detailed structure of advanced coding tutorial platforms (e.g. GeeksForGeeks).
        
        Return JSON format:
        {{
          "skill": "{skill}",
          "quick_summary": "High-level overview...",
          "estimated_study_time": "Time...",
          "sub_roadmap": [
            {{"title": "Topic X", "duration": "Time"}}
          ],
          "detailed_content": [
            {{
                "subheading": "Introduction to Topic",
                "explanation": "Detailed, multi-paragraph explanation...",
                "algorithm": "Step 1: ...\\nStep 2: ... (Optional, omit if not applicable)",
                "example": "Extensive code snippet or real-world analogy here...",
                "complexity": "Time: O(N), Space: O(1) (Optional, omit if not applicable)"
            }}
          ],
          "pro_tip": "Industry Hack..."
        }}
        Ensure detailed_content has at least 3-5 sections diving deep into {skill}.{context_prompt}
        """
        try:
            # model.run in Bytez is typically synchronous in the JS snippet provided 
            # but usually SDKs provide async or it's wrapped.
            # Using the direct model run from the snippet.
            res = self.model.run([{"role": "user", "content": prompt}])
            
            # Extract content from Bytez output structure
            content = ""
            if isinstance(res, dict):
                content = res.get("output", {}).get("content", "") if isinstance(res.get("output"), dict) else str(res.get("output", ""))
            elif hasattr(res, 'output'):
                content = res.output.get("content", "") if isinstance(res.output, dict) else str(res.output)
            else:
                content = str(res)

            # JSON cleanup (models sometimes put backticks)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return json.loads(content)
        except Exception as e:
            log.error(f"Bytez Study Guide failed: {e}")
            return {"skill": skill, "is_fallback": True}

    async def generate_quiz(self, skill: str) -> Dict[str, Any]:
        """Generates 3 verification questions for a skill."""
        if not self.model: return {"is_fallback": True}
        
        prompt = f"Generate 3 multiple choice questions for {skill} as JSON: {{'questions': [{{'id':1, 'question':'', 'options':[], 'correct_index':0, 'explanation':''}}]}}"
        try:
            res = self.model.run([{"role": "user", "content": prompt}])
            
            content = ""
            if isinstance(res, dict):
                content = res.get("output", {}).get("content", "") if isinstance(res.get("output"), dict) else str(res.get("output", ""))
            elif hasattr(res, 'output'):
                content = res.output.get("content", "") if isinstance(res.output, dict) else str(res.output)
            else:
                content = str(res)
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return json.loads(content)
        except Exception as e:
            log.error(f"Generate quiz failed: {e}")
            return {"is_fallback": True}

    async def get_market_forecast(self, role: str, missing: List[str]) -> Dict[str, Any]:
        """Generates market snapshot."""
        if not self.model: return {"is_fallback": True}
        prompt = f"Forecast for {role}. Skills: {missing}. JSON: {{'trend_title':'', 'growth_pct':0, 'summary':'', 'sources':[]}}"
        try:
            res = self.model.run([{"role": "user", "content": prompt}])
            
            content = ""
            if isinstance(res, dict):
                content = res.get("output", {}).get("content", "") if isinstance(res.get("output"), dict) else str(res.get("output", ""))
            elif hasattr(res, 'output'):
                content = res.output.get("content", "") if isinstance(res.output, dict) else str(res.output)
            else:
                content = str(res)
                
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            return json.loads(content)
        except Exception as e:
            log.error(f"Generate forecast failed: {e}")
            return {"is_fallback": True}

bytez_service = BytezService(os.getenv("BYTEZ_API_KEY", ""))
