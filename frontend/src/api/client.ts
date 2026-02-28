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
export async function uploadResume(file: File, role: string): Promise<UploadResult> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('role', role)
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
