import { useResume } from '../context/ResumeContext'
import { Mic } from 'lucide-react'

export default function InterviewReadiness() {
    const { analysis, prediction } = useResume()

    const score = analysis?.final_score ?? 55
    const weakAreas = prediction?.weak_areas ?? []

    const STRENGTHS = analysis?.detected_skills?.slice(0, 4).map(s =>
        s.charAt(0).toUpperCase() + s.slice(1)
    ) ?? ['Data Structures', 'Python Programming', 'REST APIs', 'SQL Databases']

    const IMPROVEMENTS = weakAreas.length
        ? weakAreas
        : ['System Design', 'Behavioral Questions', 'Time Management', 'Communication']

    const label =
        score >= 80 ? 'Interview Ready' :
            score >= 60 ? 'Placement Ready' :
                score >= 40 ? 'Developing' : 'Beginner'

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Interview Readiness</div>
                <div className="page-subtitle">Assess your interview preparation level</div>
            </div>

            {/* Meter card */}
            <div className="card mb-16">
                <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                    Readiness Level
                </div>
                <div className="readiness-meter">
                    <div className="readiness-meter__cursor" style={{ left: `${score}%` }} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, textAlign: 'center', marginTop: 16, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                    {score}% — <span style={{ color: 'var(--blue)' }}>{label}</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button className="btn btn--primary">
                        <Mic size={14} /> Start Mock Interview
                    </button>
                </div>
            </div>

            {/* Strengths + Improvements */}
            <div className="grid-2">
                <div className="card">
                    <div className="flex items-center gap-8 mb-16">
                        <span style={{ color: 'var(--green)' }}>●</span>
                        <div className="card-title" style={{ marginBottom: 0 }}>Strength Areas</div>
                    </div>
                    {STRENGTHS.map((s, i) => (
                        <div key={i} className="area-item area-item--strength">{s}</div>
                    ))}
                </div>

                <div className="card">
                    <div className="flex items-center gap-8 mb-16">
                        <span style={{ color: 'var(--orange)' }}>●</span>
                        <div className="card-title" style={{ marginBottom: 0 }}>Improvement Focus</div>
                    </div>
                    {IMPROVEMENTS.map((s, i) => (
                        <div key={i} className="area-item area-item--weak">{s}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}
