from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.ai_service import ai_service
from app.services.curriculum_graph import (
    get_prerequisites, get_unlocked_skills, get_learning_path,
    get_curriculum_overview, can_unlock
)

router = APIRouter(prefix="/ai", tags=["AI Insights"])

class ForecastRequest(BaseModel):
    role: str
    missing_skills: List[str]

class ChatRequest(BaseModel):
    skill: str
    query: str
    history: Optional[List[dict]] = []
    mastered_skills: Optional[List[str]] = []

class ContributionRequest(BaseModel):
    skill: str
    submitted_by: str
    notes_content: Dict[str, Any]

@router.post("/market-forecast")
async def get_forecast(req: ForecastRequest):
    """Get a dynamic market forecast."""
    if not req.role or not req.missing_skills:
        raise HTTPException(status_code=400, detail="Role and missing skills required.")
    return await ai_service.get_market_forecast(req.role, req.missing_skills)

@router.get("/study/notes")
async def get_study_notes(skill: str, existing_skills: Optional[str] = None):
    """Generates study notes for a specific skill."""
    if not skill:
        raise HTTPException(status_code=400, detail="Skill name is required.")
    return await ai_service.get_study_materials(skill, existing_skills or "")

@router.get("/study/quiz")
async def get_study_quiz(skill: str):
    """Generates a verification quiz for a specific skill."""
    if not skill:
        raise HTTPException(status_code=400, detail="Skill name is required.")
    return await ai_service.generate_quiz(skill)

@router.post("/study/chat")
async def study_chat(req: ChatRequest):
    """Provides a chat interface for a specific skill."""
    if not req.skill or not req.query:
        raise HTTPException(status_code=400, detail="Skill and query are required.")
    
    context = f"Student already knows: {', '.join(req.mastered_skills or [])}"
    content = await ai_service.get_chat_response(req.skill, req.query, req.history, context)
    return {"response": content}

# ── Community & Admin Routes ──
from app.db.local_db import local_db

@router.post("/study/contribute")
async def submit_contribution(req: ContributionRequest):
    local_db.add_contribution(req.skill, req.submitted_by, req.notes_content)
    return {"status": "success", "message": "Contribution submitted for review."}

@router.get("/admin/contributions")
async def get_pending_contributions():
    return local_db.get_contributions(status="pending")

@router.post("/admin/contributions/{id}/approve")
async def approve_contribution(id: int):
    contrib = local_db.get_contribution_by_id(id)
    if not contrib:
        raise HTTPException(status_code=404, detail="Not found")
    
    import json
    content = json.loads(contrib["content"])
    # Move to knowledge cache
    local_db.cache_knowledge(contrib["topic"], "study", content)
    local_db.update_contribution_status(id, "approved")
    return {"status": "success"}

@router.post("/admin/contributions/{id}/reject")
async def reject_contribution(id: int):
    success = local_db.update_contribution_status(id, "rejected")
    if not success:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "success"}

@router.get("/admin/stats")
async def get_admin_stats():
    pending = len(local_db.get_contributions(status="pending"))
    approved = len(local_db.get_contributions(status="approved"))
    total_skills = local_db.get_all_topics_count()
    return {
        "pending_reviews": pending,
        "approved_contributions": approved,
        "total_courses_cached": total_skills,
        "active_students": 142  # Mock metric for dashboard aesthetics
    }


# ── Curriculum Graph Routes ──────────────────────────────────────────────────

class CurriculumRequest(BaseModel):
    mastered_skills: List[str]

class UnlockCheckRequest(BaseModel):
    skill: str
    mastered_skills: List[str]
    quiz_score: Optional[float] = 0.0


@router.get("/curriculum/overview")
def curriculum_overview():
    """Returns the full skill dependency graph and metadata."""
    return get_curriculum_overview()


@router.get("/curriculum/prerequisites")
def skill_prerequisites(skill: str):
    """Returns prerequisite skills for a given topic."""
    prereqs = get_prerequisites(skill)
    return {"skill": skill, "prerequisites": prereqs}


@router.post("/curriculum/unlocked")
def unlocked_skills(req: CurriculumRequest):
    """Returns all skills unlocked based on the student's mastered skill set."""
    return {"mastered": req.mastered_skills, "unlocked": get_unlocked_skills(req.mastered_skills)}


@router.post("/curriculum/learning-path")
def learning_path(skill: str, req: CurriculumRequest):
    """Returns the ordered prerequisite learning path to reach a target skill."""
    path = get_learning_path(skill, req.mastered_skills)
    return {"target": skill, "learning_path": path, "total_steps": len(path)}


@router.post("/curriculum/can-unlock")
def check_unlock(req: UnlockCheckRequest):
    """Checks if a student can unlock a skill based on prerequisites and quiz score."""
    return can_unlock(req.skill, req.mastered_skills, req.quiz_score)
