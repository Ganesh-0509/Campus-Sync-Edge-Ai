import { useState } from 'react'
import { useResume, getImprovementPlan } from '../context/ResumeContext'
import { CheckCircle, Circle } from 'lucide-react'

export default function ImprovementPlan() {
    const { analysis } = useResume()

    const plan = analysis
        ? getImprovementPlan(analysis.missing_core_skills, analysis.missing_optional_skills, analysis.recommendations)
        : [
            { days: 'Day 1–2', title: 'Data Structures & Algorithms Practice', tags: ['Arrays', 'Linked Lists', 'Trees'], done: true },
            { days: 'Day 3–4', title: 'Backend Framework Deep Dive', tags: ['Node.js', 'Express', 'REST API Design'], done: false },
            { days: 'Day 5–6', title: 'System Design Basics', tags: ['Scalability', 'Load Balancing', 'Caching'], done: false },
            { days: 'Day 7', title: 'Build Mini Project', tags: ['Full-stack app', 'Deploy to cloud'], done: false },
        ]

    const [checks, setChecks] = useState<boolean[]>(plan.map(p => p.done))
    const toggle = (i: number) => setChecks(c => c.map((v, j) => j === i ? !v : v))

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Improvement Plan</div>
                <div className="page-subtitle">Your personalized 7-day roadmap</div>
            </div>

            <div className="card">
                {plan.map((item, i) => (
                    <div className="timeline-item" key={i}>
                        <div
                            className={`timeline-item__check${checks[i] ? ' done' : ''}`}
                            onClick={() => toggle(i)}
                            style={{ cursor: 'pointer' }}
                        >
                            {checks[i]
                                ? <CheckCircle size={14} color="var(--green)" />
                                : <Circle size={14} color="var(--text-muted)" />
                            }
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="timeline-item__day">{item.days}</div>
                            <div className="timeline-item__title"
                                style={{ textDecoration: checks[i] ? 'line-through' : 'none', opacity: checks[i] ? 0.5 : 1 }}>
                                {item.title}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
                <div className="card-title mb-8">Progress</div>
                <div className="progress-track">
                    <div
                        className="progress-fill progress-fill--green"
                        style={{ width: `${(checks.filter(Boolean).length / checks.length) * 100}%` }}
                    />
                </div>
                <div className="text-sm" style={{ marginTop: 6 }}>
                    {checks.filter(Boolean).length} of {checks.length} tasks completed
                </div>
            </div>
        </div>
    )
}
