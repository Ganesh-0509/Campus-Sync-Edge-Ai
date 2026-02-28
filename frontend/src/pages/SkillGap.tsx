import { useState, useEffect } from 'react'
import { useResume } from '../context/ResumeContext'
import { BarChart2 } from 'lucide-react'
import SkillGraphViz from '../components/SkillGraphViz'

const BASE = 'http://localhost:8000'

const DEMO_GAPS = [
    { skill: 'System Design', priority: 'High', action: 'Start Course' },
    { skill: 'Docker & Kubernetes', priority: 'High', action: 'Practice Lab' },
    { skill: 'GraphQL', priority: 'Medium', action: 'Tutorial' },
    { skill: 'CI/CD Pipelines', priority: 'Medium', action: 'Hands-on' },
    { skill: 'TypeScript Advanced', priority: 'Low', action: 'Read Docs' },
]

export default function SkillGap() {
    const { analysis } = useResume()
    const [deps, setDeps] = useState<Record<string, string[]>>({})
    const [showGraph, setShowGraph] = useState(true)

    useEffect(() => {
        fetch(`${BASE}/interview/dependencies`)
            .then(r => r.json())
            .then(d => setDeps(d))
            .catch(() => { })
    }, [])

    const gaps: Array<{ skill: string; priority: string; action: string }> = analysis
        ? [
            ...(analysis.missing_core_skills ?? []).map(s => ({
                skill: s.charAt(0).toUpperCase() + s.slice(1),
                priority: 'High',
                action: 'Start Course',
            })),
            ...(analysis.missing_optional_skills ?? []).map((s, i) => ({
                skill: s.charAt(0).toUpperCase() + s.slice(1),
                priority: i < 2 ? 'Medium' : 'Low',
                action: i < 2 ? 'Tutorial' : 'Read Docs',
            })),
        ]
        : DEMO_GAPS

    const getPrereqs = (skillName: string): string[] =>
        deps[skillName.toLowerCase()] ?? []

    const detected = analysis?.detected_skills ?? ['python', 'react', 'git', 'sql', 'javascript', 'flask']
    const coreGaps = analysis?.missing_core_skills ?? ['docker', 'system design', 'ci/cd']
    const optGaps = analysis?.missing_optional_skills ?? ['graphql', 'aws', 'typescript']

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Skill Gap Analysis</div>
                <div className="page-subtitle">
                    Identify and close your gaps — with live dependency chains
                </div>
            </div>

            {/* ── Skill Dependency Graph ── */}
            <div className="card mb-16">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                        <div className="card-title" style={{ marginBottom: 2 }}>🕸 Skill Dependency Graph</div>
                        <div className="card-subtitle">Your skills (green) vs gaps (red/orange) — dashed lines show prerequisites</div>
                    </div>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setShowGraph(v => !v)}
                    >
                        {showGraph ? 'Hide Graph' : 'Show Graph'}
                    </button>
                </div>
                {showGraph && (
                    <SkillGraphViz
                        detected={detected}
                        missingCore={coreGaps}
                        missingOptional={optGaps}
                        dependencies={deps}
                    />
                )}
                {!analysis && (
                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                        ☝ Upload a resume to personalise the graph with your real skills
                    </div>
                )}
            </div>

            {/* ── Skill gap list ── */}
            <div className="card mb-16">
                <div className="card-title mb-16">Gap Details</div>
                {gaps.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">🎉</div>
                        <div className="empty-state__text">No critical skill gaps detected for your target role.</div>
                    </div>
                ) : (
                    gaps.map((g, i) => {
                        const prereqs = getPrereqs(g.skill)
                        return (
                            <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 14 }}>
                                <div className="gap-row" style={{ marginBottom: prereqs.length ? 8 : 0 }}>
                                    <span className="gap-row__num">{i + 1}</span>
                                    <BarChart2 size={14} color="var(--blue)" style={{ flexShrink: 0 }} />
                                    <span className="gap-row__name">{g.skill}</span>
                                    <div className="gap-row__actions">
                                        <span className={`badge badge--${g.priority.toLowerCase()}`}>{g.priority}</span>
                                        <button className="btn btn--ghost btn--sm">{g.action} →</button>
                                    </div>
                                </div>

                                {prereqs.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 40, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Learn first:</span>
                                        {prereqs.map(p => (
                                            <span key={p} style={{
                                                fontSize: 11, padding: '2px 8px', borderRadius: 6,
                                                background: 'rgba(34,211,238,0.08)',
                                                border: '1px solid rgba(34,211,238,0.2)',
                                                color: 'var(--cyan)', fontWeight: 600,
                                            }}>{p}</span>
                                        ))}
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→ then {g.skill}</span>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
