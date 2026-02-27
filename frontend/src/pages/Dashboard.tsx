import { useNavigate } from 'react-router-dom'
import { useResume, getIndustryAlignment } from '../context/ResumeContext'
import MiniLineChart from '../components/MiniLineChart'
import { Upload, AlertCircle, Lightbulb, Activity } from 'lucide-react'

const SCORE_HISTORY = [
    { label: 'W1', value: 35 }, { label: 'W2', value: 42 }, { label: 'W3', value: 50 },
    { label: 'W4', value: 56 }, { label: 'W5', value: 63 }, { label: 'W6', value: 74 },
]

const COLORS = ['--blue', '--cyan', '--green', '--purple']

export default function Dashboard() {
    const { analysis, prediction } = useResume()
    const navigate = useNavigate()

    const score = analysis?.final_score ?? 72
    const corePct = analysis?.core_coverage_percent ?? 68
    const missingCount = (analysis?.missing_core_skills?.length ?? 0) + (analysis?.missing_optional_skills?.length ?? 0)
    const readiness = analysis?.readiness_category ?? 'Developing'
    const skills = analysis?.detected_skills ?? []
    const missingCore = analysis?.missing_core_skills ?? ['System Design', 'Docker & Kubernetes', 'GraphQL', 'CI/CD Pipelines', 'TypeScript Advanced']
    const recs = analysis?.recommendations ?? []
    const align = getIndustryAlignment(score)

    const METRICS = [
        { icon: <Activity size={14} />, label: 'Readiness Score', value: `${score}%`, sub: '+5% this week', pct: score, bg: 'rgba(59,130,246,0.12)', col: '#3b82f6' },
        { icon: <Lightbulb size={14} />, label: 'Core Skill Coverage', value: `${corePct}%`, sub: `${Math.round(corePct / 100 * 18)} of 18 skills`, pct: corePct, bg: 'rgba(34,211,238,0.12)', col: '#22d3ee' },
        { icon: <AlertCircle size={14} />, label: 'Missing Critical Skills', value: String(missingCount || 6), sub: '3 high priority', pct: (missingCount / 10) * 100, bg: 'rgba(245,158,11,0.12)', col: '#f59e0b' },
        { icon: <Activity size={14} />, label: 'Interview Readiness', value: readiness, sub: 'Level 2 of 4', pct: score * 0.8, bg: 'rgba(167,139,250,0.12)', col: '#a78bfa' },
    ]

    const SKILL_COVERAGE = [
        { label: 'Programming Languages', pct: Math.min(100, Math.round(skills.filter(s => ['python', 'java', 'javascript', 'c', 'c++', 'typescript', 'go', 'rust'].includes(s)).length * 18 + 30)), cls: 'blue' },
        { label: 'Frameworks', pct: Math.min(100, Math.round(skills.filter(s => ['react', 'vue', 'angular', 'django', 'flask', 'fastapi', 'spring'].includes(s)).length * 15 + 20)), cls: 'cyan' },
        { label: 'Core CS Concepts', pct: Math.min(100, Math.round(skills.filter(s => ['dsa', 'sql', 'git', 'api', 'rest', 'testing', 'debugging'].includes(s)).length * 14 + 40)), cls: 'green' },
        { label: 'Tools & Platforms', pct: Math.min(100, Math.round(skills.filter(s => ['docker', 'aws', 'gcp', 'kubernetes', 'linux', 'git'].includes(s)).length * 12 + 20)), cls: 'purple' },
    ]
    // Ensure min 20 for demo
    SKILL_COVERAGE.forEach(s => { if (s.pct < 20) s.pct = 20 + Math.floor(Math.random() * 40) })

    const TOP_MISSING = missingCore.slice(0, 5).map((skill, i) => ({
        skill, priority: i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low'
    }))

    const PLAN = [
        { day: 'Day 1–2', title: TOP_MISSING[0]?.skill ?? 'Data Structures Practice', done: true },
        { day: 'Day 3–4', title: TOP_MISSING[1]?.skill ?? 'Backend Framework Setup', done: false },
        { day: 'Day 5–7', title: 'Build Mini Project', done: false },
    ]

    return (
        <div className="page-content">
            {/* Hero */}
            <div className="hero">
                <h1>Measure. Improve. <span className="accent">Achieve.</span></h1>
                <p>AI-powered job readiness intelligence for engineering students.</p>
                <button className="btn btn--primary" onClick={() => navigate('/resume-analyzer')}>
                    <Upload size={14} /> Upload Resume
                </button>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
                {METRICS.map((m, i) => (
                    <div key={i} className="metric-card" style={{ background: m.bg }}>
                        <div className="metric-card__icon" style={{ background: `${m.col}22`, color: m.col }}>{m.icon}</div>
                        <div className="metric-card__value">{m.value}</div>
                        <div className="metric-card__label">{m.label}</div>
                        <div className="metric-card__bar">
                            <div className="metric-card__bar-fill" style={{ width: `${m.pct}%`, background: m.col }} />
                        </div>
                        <div className="metric-card__sub">{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* Skill Coverage + Skill Gaps */}
            <div className="grid-auto mb-16">
                <div className="card">
                    <div className="card-title mb-4">Skill Coverage</div>
                    <div className="card-subtitle mb-16">Your proficiency across key areas</div>
                    {SKILL_COVERAGE.map((s, i) => (
                        <div className="progress-row" key={i}>
                            <div className="progress-label">
                                <span>{s.label}</span>
                                <span>{s.pct}%</span>
                            </div>
                            <div className="progress-track">
                                <div className={`progress-fill progress-fill--${s.cls}`} style={{ width: `${s.pct}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="card-title">Skill Gaps</div>
                        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/skill-gap')}>
                            Start Improvement →
                        </button>
                    </div>
                    <div className="card-subtitle mb-16">Top {TOP_MISSING.length} missing skills to focus on</div>
                    {TOP_MISSING.map((item, i) => (
                        <div className="gap-row" key={i}>
                            <span className="gap-row__num">{i + 1}</span>
                            <span className="gap-row__name">{item.skill}</span>
                            <span className={`badge badge--${item.priority.toLowerCase()}`}>{item.priority}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 7-Day Plan + Score Growth + Industry Alignment */}
            <div className="grid-3">
                <div className="card">
                    <div className="card-title mb-4">7-Day Plan</div>
                    <div className="card-subtitle mb-12">Your improvement roadmap</div>
                    {PLAN.map((p, i) => (
                        <div className="timeline-item" key={i}>
                            <div className={`timeline-item__check${p.done ? ' done' : ''}`}>
                                {p.done ? '✓' : ''}
                            </div>
                            <div>
                                <div className="timeline-item__day">{p.day}</div>
                                <div className="timeline-item__title">{p.title}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="card-title mb-4">Score Growth</div>
                    <div className="card-subtitle mb-12">Readiness score over time</div>
                    <MiniLineChart data={SCORE_HISTORY} height={100} />
                </div>

                <div className="card">
                    <div className="card-title mb-4">Industry Alignment</div>
                    <div className="card-subtitle mb-12">Your fit across company types</div>
                    {[
                        { label: 'Service-Based', sub: 'TCS, Infosys, Wipro', pct: align.service, cls: 'blue' },
                        { label: 'Product-Based', sub: 'Google, Amazon, Meta', pct: align.product, cls: 'cyan' },
                        { label: 'Startup Roles', sub: 'Early-stage, Series A', pct: align.startup, cls: 'green' },
                    ].map((a, i) => (
                        <div key={i} className="mb-12">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
                                    <div className="text-muted">{a.sub}</div>
                                </div>
                                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--blue)' }}>{a.pct}%</span>
                            </div>
                            <div className="progress-track">
                                <div className={`progress-fill progress-fill--${a.cls}`} style={{ width: `${a.pct}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
