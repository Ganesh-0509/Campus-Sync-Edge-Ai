"""
analyze.py — upload endpoint.

Scores the resume deterministically, then persists the result to Supabase.
If Supabase is not configured the scoring result is still returned — a
db_warning field is added to the response instead of raising a 500.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.resume_parser import parse_resume
from app.services.skill_dictionary import extract_skills
from app.services.role_readiness_engine import calculate_role_readiness
from app.services.role_matrix import VALID_ROLES
from app.core.supabase_client import get_supabase
from app.services.encryption_service import encrypt_text, is_encryption_enabled

router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    role: str = Form(...),
    privacy_mode: bool = Form(False),
):
    """
    Upload a PDF or DOCX resume with a target role and receive a full
    readiness analysis. Result is persisted to Supabase automatically.
    """
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{role}'. Choose from: {VALID_ROLES}",
        )

    try:
        file_bytes = await file.read()

        # ── Core deterministic pipeline ──────────────────────────────────────
        parsed  = parse_resume(file_bytes, file.filename)
        skills  = extract_skills(parsed["raw_text"])
        result  = calculate_role_readiness(
            resume_skills     = skills,
            sections_detected = parsed["sections_detected"],
            raw_text          = parsed["raw_text"],
            role_name         = role,
        )

        result["filename"]          = file.filename
        result["detected_skills"]   = skills
        result["sections_detected"] = parsed["sections_detected"]
        result["links"]             = parsed["links"]

        # ── Persist to Supabase (non-fatal if unavailable) ───────────────────
        resume_id   = None
        analysis_id = None
        db_warning  = None

        if privacy_mode:
            db_warning = "Privacy Mode Active: Data processed in-memory only. No cloud storage used."
        else:
            try:
                sb = get_supabase()

                # Insert resume row
                resume_resp = sb.table("resumes").insert({
                    "filename":          file.filename,
                    "raw_text":          encrypt_text(parsed["raw_text"]),  # encrypted at rest
                    "detected_skills":   skills,
                    "sections_detected": parsed["sections_detected"],
                    "links":             parsed["links"],
                    "encrypted":         is_encryption_enabled(),
                }).execute()
                resume_id = resume_resp.data[0]["id"]

                # Insert role analysis row
                analysis_resp = sb.table("role_analyses").insert({
                    "resume_id":                 resume_id,
                    "role":                      result["role"],
                    "final_score":               result["final_score"],
                    "readiness_category":        result["readiness_category"],
                    "core_coverage_percent":     result["core_coverage_percent"],
                    "optional_coverage_percent": result["optional_coverage_percent"],
                    "project_score_percent":     result["project_score_percent"],
                    "ats_score_percent":         result["ats_score_percent"],
                    "structure_score_percent":   result["structure_score_percent"],
                    "missing_core_skills":       result["missing_core_skills"],
                    "missing_optional_skills":   result["missing_optional_skills"],
                    "recommendations":           result["recommendations"],
                }).execute()
                analysis_id = analysis_resp.data[0]["id"]

            except EnvironmentError as e:
                db_warning = f"Supabase not configured — result not saved. {e}"
            except Exception as e:
                db_warning = f"DB save failed (scoring still valid): {e}"

        result["resume_id"]   = resume_id
        result["analysis_id"] = analysis_id
        if db_warning:
            result["db_warning"] = db_warning
        
        result["privacy_active"] = privacy_mode

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/roles")
def list_roles():
    """Return supported roles (loaded from roles.json)."""
    return {"valid_roles": VALID_ROLES}