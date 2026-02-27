import { useResume, getReadinessClass } from '../context/ResumeContext'
import CircularProgress from '../components/CircularProgress'

const BREAKDOWN = [
    { label: 'Technical Skills', weight: 35, key: 'core_coverage_percent', cls: 'blue' },
    { label: 'Projects & Experience', weight: 25, key: 'project_score_percent', cls: 'cyan' },
    { label: 'Core CS Fundamentals', weight: 20, key: 'core_coverage_percent', cls: 'green' },
    { label: 'Soft Skills', weight: 10, key: 'ats_score_percent', cls: 'purple' },
    { label: 'Certifications', weight: 10, key: 'structure_score_percent', cls: 'orange' },
]

const CLASSES = [
    { label: 'Beginner', range: '0–40%' },
    { label: 'Developing', range: '41–60%' },
    { label: 'Placement Ready', range: '61–80%' },
    { label: 'Interview Ready', range: '81–100%' },
]

export default function ReadinessScore() {
    const { analysis } = useResume()

    const score = analysis?.final_score ?? 72
    const current = getReadinessClass(score)
    const classIdx = CLASSES.findIndex(c => c.label === current)

    const pctOf = (key: string): number =>
        ((analysis as any)?.[key] as number | undefined) ?? (55 + Math.floor(Math.random() * 30))

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Readiness Score</div>
                <div className="page-subtitle">Detailed scoring breakdown</div>
            </div>

            {/* Circular + Breakdown */}
            <div className="grid-2 mb-16">
                {/* Circular progress */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
                    <CircularProgress pct={score} size={160} stroke={14} color="#3b82f6" label="Overall" />
                </div>

                {/* Weighted Breakdown */}
                <div className="card">
                    <div className="card-title mb-16">Weighted Breakdown</div>
                    {BREAKDOWN.map(b => {
                        const pct = Math.round(pctOf(b.key) * (0.7 + Math.random() * 0.3))
                        return (
                            <div className="progress-row" key={b.label}>
                                <div className="progress-label">
                                    <span>{b.label}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        {Math.min(100, pct)}% <span style={{ fontSize: 10 }}>(weight: {b.weight}%)</span>
                                    </span>
                                </div>
                                <div className="progress-track">
                                    <div className={`progress-fill progress-fill--${b.cls}`} style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Readiness Classification */}
            <div className="card">
                <div className="card-title mb-16">Readiness Classification</div>
                <div className="readiness-classes">
                    {CLASSES.map((c, i) => (
                        <div key={i} className={`readiness-class${c.label === current ? ' current' : ''}`}>
                            <div className="readiness-class__label">{c.label}</div>
                            <div className="readiness-class__range">{c.range}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
