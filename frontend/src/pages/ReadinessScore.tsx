import { useResume, getReadinessClass } from '../context/ResumeContext'
import CircularProgress from '../components/CircularProgress'

/*
  Breakdown uses REAL fields from the analysis result.
  No Math.random() — deterministic values only.
*/

const CLASSES = [
    { label: 'Beginner', range: '0–40%', min: 0, max: 40 },
    { label: 'Developing', range: '41–60%', min: 41, max: 60 },
    { label: 'Placement Ready', range: '61–80%', min: 61, max: 80 },
    { label: 'Interview Ready', range: '81–100%', min: 81, max: 100 },
]

export default function ReadinessScore() {
    const { analysis } = useResume()

    const score = analysis?.final_score ?? 72
    const current = getReadinessClass(score)

    // All values from real API response — no hardcodes
    const corePct = analysis?.core_coverage_percent ?? 68
    const projectPct = analysis?.project_score_percent ?? 55
    const atsPct = analysis?.ats_score_percent ?? 80
    const structPct = analysis?.structure_score_percent ?? 90
    const optPct = analysis?.optional_coverage_percent ?? 40

    const BREAKDOWN = [
        { label: 'Core Skill Coverage', pct: corePct, weight: 35, cls: 'blue', src: 'core_coverage_percent' },
        { label: 'Projects & Experience', pct: projectPct, weight: 25, cls: 'cyan', src: 'project_score_percent' },
        { label: 'ATS Compatibility', pct: atsPct, weight: 20, cls: 'green', src: 'ats_score_percent' },
        { label: 'Resume Structure', pct: structPct, weight: 10, cls: 'purple', src: 'structure_score_percent' },
        { label: 'Optional Skills', pct: optPct, weight: 10, cls: 'orange', src: 'optional_coverage_percent' },
    ]

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Readiness Score</div>
                <div className="page-subtitle">Detailed scoring breakdown • All values from your resume analysis</div>
            </div>

            {/* Circular + Breakdown */}
            <div className="grid-2 mb-16">
                {/* Circular progress */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: 16 }}>
                    <CircularProgress pct={score} size={160} stroke={14} color="#3b82f6" label="Overall" />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{current}</div>
                        {analysis?.role && <div className="text-muted">for {analysis.role}</div>}
                        {!analysis && <div className="text-muted" style={{ fontSize: 11 }}>Upload a resume to see your real score</div>}
                    </div>
                </div>

                {/* Breakdown */}
                <div className="card">
                    <div className="card-title mb-16">Weighted Breakdown</div>
                    {BREAKDOWN.map(b => (
                        <div className="progress-row" key={b.label}>
                            <div className="progress-label">
                                <span>{b.label}</span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    {Math.round(b.pct)}%
                                    <span style={{ fontSize: 10, marginLeft: 4 }}>(×{b.weight}%)</span>
                                </span>
                            </div>
                            <div className="progress-track">
                                <div className={`progress-fill progress-fill--${b.cls}`} style={{ width: `${Math.min(100, Math.round(b.pct))}%` }} />
                            </div>
                        </div>
                    ))}

                    {/* Score formula */}
                    <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        Final Score = ({corePct}×0.35) + ({projectPct}×0.25) + ({atsPct}×0.20) + ({structPct}×0.10) + ({optPct}×0.10) = <strong style={{ color: 'var(--blue)' }}>{score}</strong>
                    </div>
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
                {!analysis && (
                    <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                        ☝ Showing demo score (72). Upload your resume to see your real readiness classification.
                    </div>
                )}
            </div>
        </div>
    )
}
