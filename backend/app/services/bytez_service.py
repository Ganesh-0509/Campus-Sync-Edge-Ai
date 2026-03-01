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
                self.model = self.sdk.model("google/gemini-2.5-flash-lite")
            except Exception as e:
                log.error(f"Failed to initialize Bytez SDK: {e}")

    async def get_study_materials(self, skill: str, existing_skills: str = "") -> Dict[str, Any]:
        """Provides personalized study materials for a skill."""
        if not self.model:
            return {"skill": skill, "is_fallback": True}

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
        Ensure detailed_content has at least 3-5 sections diving deep into {skill}.
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
            if hasattr(res, 'output'):
                content = res.output.get("content", "") if isinstance(res.output, dict) else str(res.output)
            else:
                content = str(res)
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            return json.loads(content)
        except:
            return {"is_fallback": True}

    async def get_market_forecast(self, role: str, missing: List[str]) -> Dict[str, Any]:
        """Generates market snapshot."""
        if not self.model: return {"is_fallback": True}
        prompt = f"Forecast for {role}. Skills: {missing}. JSON: {{'trend_title':'', 'growth_pct':0, 'summary':'', 'sources':[]}}"
        try:
            res = self.model.run([{"role": "user", "content": prompt}])
            content = str(res.output if hasattr(res, 'output') else res)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            return json.loads(content)
        except:
            return {"is_fallback": True}

bytez_service = BytezService(os.getenv("BYTEZ_API_KEY", ""))
