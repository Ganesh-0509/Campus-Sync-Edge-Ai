import { useResume } from '../context/ResumeContext'
import { BarChart2 } from 'lucide-react'

const DEMO_GAPS = [
    { skill: 'System Design', priority: 'High', action: 'Start Course' },
    { skill: 'Docker & Kubernetes', priority: 'High', action: 'Practice Lab' },
    { skill: 'GraphQL', priority: 'Medium', action: 'Tutorial' },
    { skill: 'CI/CD Pipelines', priority: 'Medium', action: 'Hands-on' },
    { skill: 'TypeScript Advanced', priority: 'Low', action: 'Read Docs' },
    { skill: 'Cloud Architecture', priority: 'High', action: 'Start Course' },
]

export default function SkillGap() {
    const { analysis } = useResume()

    const gaps = analysis
        ? [
            ...(analysis.missing_core_skills ?? []).map((s, i) => ({
                skill: s, priority: 'High', action: 'Start Course'
            })),
            ...(analysis.missing_optional_skills ?? []).map((s, i) => ({
                skill: s, priority: i < 2 ? 'Medium' : 'Low', action: i < 2 ? 'Tutorial' : 'Read Docs'
            })),
        ]
        : DEMO_GAPS

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Skill Gap Analysis</div>
                <div className="page-subtitle">Identify and close your skill gaps</div>
            </div>

            <div className="card">
                {gaps.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">🎉</div>
                        <div className="empty-state__text">No critical skill gaps detected for your target role.</div>
                    </div>
                ) : (
                    gaps.map((g, i) => (
                        <div className="gap-row" key={i}>
                            <span className="gap-row__num">{i + 1}</span>
                            <BarChart2 size={14} color="var(--blue)" style={{ flexShrink: 0 }} />
                            <span className="gap-row__name">{g.skill}</span>
                            <div className="gap-row__actions">
                                <span className={`badge badge--${g.priority.toLowerCase()}`}>{g.priority}</span>
                                <button className="btn btn--ghost btn--sm">{g.action} →</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
