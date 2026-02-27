import { useState, useEffect } from 'react'
import { useResume } from '../context/ResumeContext'
import { BarChart2 } from 'lucide-react'

const BASE = 'http://localhost:8000'

const DEMO_GAPS = [
    { skill: 'System Design', priority: 'High', action: 'Start Course' },
    { skill: 'Docker & Kubernetes', priority: 'High', action: 'Practice Lab' },
    { skill: 'GraphQL', priority: 'Medium', action: 'Tutorial' },
    { skill: 'CI/CD Pipelines', priority: 'Medium', action: 'Hands-on' },
    { skill: 'TypeScript Advanced', priority: 'Low', action: 'Read Docs' },
]

interface Dep { skill: string; prerequisites: string[] }

export default function SkillGap() {
    const { analysis } = useResume()
    const [deps, setDeps] = useState<Record<string, string[]>>({})

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

    const getPrereqs = (skillName: string): string[] => {
        const key = skillName.toLowerCase()
        return deps[key] ?? []
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Skill Gap Analysis</div>
                <div className="page-subtitle">Identify and close your skill gaps — with learning paths</div>
            </div>

            {/* Skill gap list */}
            <div className="card mb-16">
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

                                {/* Learning path (from dependency graph) */}
                                {prereqs.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 40, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Needs first:</span>
                                        {prereqs.map(p => (
                                            <span key={p} style={{
                                                fontSize: 11, padding: '2px 8px', borderRadius: 6,
                                                background: 'rgba(34,211,238,0.08)',
                                                border: '1px solid rgba(34,211,238,0.2)',
                                                color: 'var(--cyan)',
                                                fontWeight: 600,
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

            {/* Dependency graph legend */}
            <div className="card">
                <div className="card-title mb-8">📍 Skill Dependency Guide</div>
                <div className="card-subtitle mb-12">Prerequisites are loaded from the Skill Graph — learn them in order</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {[
                        { from: 'docker', needs: ['linux', 'bash'] },
                        { from: 'kubernetes', needs: ['docker', 'linux'] },
                        { from: 'react', needs: ['javascript', 'html', 'css'] },
                        { from: 'fastapi', needs: ['python', 'api'] },
                        { from: 'deep learning', needs: ['machine learning', 'numpy'] },
                    ].map(({ from, needs }, i) => (
                        <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{from}</span>
                            <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>←</span>
                            {needs.map(n => <span key={n} style={{ color: 'var(--cyan)', marginRight: 6 }}>{n}</span>)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
