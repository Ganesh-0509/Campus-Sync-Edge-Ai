const BASE = 'http://localhost:8000'

export interface UploadResult {
    role: string
    final_score: number
    readiness_category: string
    core_coverage_percent: number
    optional_coverage_percent: number
    project_score_percent: number
    ats_score_percent: number
    structure_score_percent: number
    missing_core_skills: string[]
    missing_optional_skills: string[]
    recommendations: Array<{ skill: string; priority: string; reason: string }>
    detected_skills: string[]
    sections_detected: string[]
    links: string[]
    resume_id: number | null
    analysis_id: number | null
    filename: string
    db_warning?: string
    privacy_active?: boolean
}

export interface PredictResult {
    predicted_role: string
    confidence: number
    resume_score: number
    weak_areas: string[]
    model_version: string
    inference_time_ms?: number
}

export interface HealthResult {
    status: string
    model_loaded: boolean
    model_version?: string
    vocabulary_size?: number
    trained_on?: number
    accuracy?: number
}

// ── Upload resume ─────────────────────────────────────────────
export async function uploadResume(file: File, role: string, privacyMode: boolean = false): Promise<UploadResult> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('role', role)
    fd.append('privacy_mode', String(privacyMode))
    const res = await fetch(`${BASE}/upload`, { method: 'POST', body: fd })
    if (!res.ok) {
        const err = await res.text().catch(() => 'Upload failed')
        throw new Error(err)
    }
    return res.json()
}

// ── ML Predict ────────────────────────────────────────────────
export async function predictResume(data: {
    skills: string[]
    project_score: number
    ats_score: number
    structure_score: number
    core_coverage: number
    optional_coverage: number
}): Promise<PredictResult> {
    const res = await fetch(`${BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Prediction failed')
    return res.json()
}

// ── Roles list ────────────────────────────────────────────────
export async function getRoles(): Promise<string[]> {
    const res = await fetch(`${BASE}/roles`)
    if (!res.ok) return ['Software Developer', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer']
    const data = await res.json()
    // Backend returns { valid_roles: [...] }
    return Array.isArray(data) ? data : data.valid_roles ?? data.roles ?? []
}

// ── Analytics ─────────────────────────────────────────────────
export async function getAnalytics(): Promise<Record<string, unknown>> {
    const res = await fetch(`${BASE}/analytics/role-stats`)
    if (!res.ok) return {}
    return res.json()
}

// ── History ───────────────────────────────────────────────────
export async function getHistory(resumeId: number): Promise<unknown> {
    const res = await fetch(`${BASE}/history/${resumeId}`)
    if (!res.ok) return null
    return res.json()
}

// ── Health ────────────────────────────────────────────────────
export async function getHealth(): Promise<HealthResult> {
    const res = await fetch(`${BASE}/health`)
    if (!res.ok) return { status: 'error', model_loaded: false }
    return res.json()
}

// ── AI Forecast ───────────────────────────────────────────────
export interface ForecastResult {
    trend_title: string
    growth_pct: number
    summary: string
    sources: Array<{ name: string; url: string; insight: string }>
}

export async function getMarketForecast(role: string, missingSkills: string[]): Promise<ForecastResult> {
    const res = await fetch(`${BASE}/ai/market-forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, missing_skills: missingSkills })
    })
    if (!res.ok) throw new Error('AI Forecast failed')
    return res.json()
}

export interface DetailedContent {
    subheading: string
    explanation: string
    algorithm?: string
    example: string
    complexity?: string
}

export interface StudySection {
    title: string
    description: string
}

export interface StudyNotesResult {
    skill: string
    quick_summary: string
    key_concepts?: StudySection[]
    pro_tip: string
    estimated_study_time: string
    sub_roadmap?: Array<{ title: string; duration: string }>
    detailed_content?: DetailedContent[]
}

export interface QuizQuestion {
    id: number
    question: string
    options: string[]
    correct_index: number
    explanation: string
}

export interface QuizResult {
    skill: string
    questions: QuizQuestion[]
}

export async function getStudyNotes(skill: string, masteredSkills: string[] = []): Promise<StudyNotesResult> {
    const skills = masteredSkills.join(',')
    const res = await fetch(`${BASE}/ai/study/notes?skill=${encodeURIComponent(skill)}&existing_skills=${encodeURIComponent(skills)}`)
    if (!res.ok) throw new Error('Failed to load study notes')
    return res.json()
}

export async function getStudyQuiz(skill: string): Promise<QuizResult> {
    const res = await fetch(`${BASE}/ai/study/quiz?skill=${encodeURIComponent(skill)}`)
    if (!res.ok) throw new Error('AI Quiz failed')
    return res.json()
}

export async function studyChat(skill: string, query: string, history: any[] = [], masteredSkills: string[] = []): Promise<string> {
    const res = await fetch(`${BASE}/ai/study/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, query, history, mastered_skills: masteredSkills })
    })
    if (!res.ok) throw new Error('Chat failed')
    const data = await res.json()
    return data.response
}

// ── Admin & Community ─────────────────────────────────────────
export interface AdminStats {
    pending_reviews: number
    approved_contributions: number
    total_courses_cached: number
    active_students: number
}

export interface Contribution {
    id: number
    topic: string
    submitted_by: string
    content: string
    status: string
    created_at: string
}

export async function submitContribution(skill: string, submitted_by: string, notes_content: any): Promise<{ status: string }> {
    const res = await fetch(`${BASE}/ai/study/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, submitted_by, notes_content })
    })
    if (!res.ok) throw new Error('Failed to submit contribution')
    return res.json()
}

export async function getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${BASE}/ai/admin/stats`)
    if (!res.ok) throw new Error('Failed to load admin stats')
    return res.json()
}

export async function getPendingContributions(): Promise<Contribution[]> {
    const res = await fetch(`${BASE}/ai/admin/contributions`)
    if (!res.ok) throw new Error('Failed to load contributions')
    return res.json()
}

export async function approveContribution(id: number): Promise<{ status: string }> {
    const res = await fetch(`${BASE}/ai/admin/contributions/${id}/approve`, { method: 'POST' })
    if (!res.ok) throw new Error('Approval failed')
    return res.json()
}

export async function rejectContribution(id: number): Promise<{ status: string }> {
    const res = await fetch(`${BASE}/ai/admin/contributions/${id}/reject`, { method: 'POST' })
    if (!res.ok) throw new Error('Rejection failed')
    return res.json()
}
