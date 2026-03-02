import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { getAnalytics } from '../api/client'
import { loadHistory, getHistoryOrDemo } from '../utils/history'
import { Upload, AlertCircle, Lightbulb, Activity, TrendingUp } from 'lucide-react'

export default function Dashboard() {
    const { analysis, prediction, bestFit, loading } = useResume()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [analytics, setAnalytics] = useState<any>(null)

    useEffect(() => {
        getAnalytics().then(d => setAnalytics(d)).catch(() => { })
    }, [])

    const chartHistory = getHistoryOrDemo(loadHistory(user?.email))

    const score = analysis?.final_score ?? 0
    const corePct = analysis?.core_coverage_percent ?? 0
    const missingCount = analysis ? (analysis.missing_core_skills?.length ?? 0) + (analysis.missing_optional_skills?.length ?? 0) : 0
    const readiness = analysis?.readiness_category ?? 'Unknown'
    const skills = analysis?.detected_skills ?? []
    const missingCore = analysis?.missing_core_skills ?? []

    // Skill coverage: computed from real detected_skills
    const hasSkill = (list: string[]) => list.filter(s => skills.map(x => x.toLowerCase()).includes(s)).length
    const SKILL_COVERAGE = [
        { label: 'Programming Languages', pct: analysis ? Math.min(100, Math.round(hasSkill(['python', 'java', 'javascript', 'typescript', 'c', 'c++', 'go', 'rust', 'kotlin']) / 9 * 100) + 20) : 0, cls: 'blue' },
        { label: 'Frameworks', pct: analysis ? Math.min(100, Math.round(hasSkill(['react', 'vue', 'angular', 'django', 'flask', 'fastapi', 'spring', 'express', 'next']) / 9 * 100) + 15) : 0, cls: 'cyan' },
        { label: 'Core CS Concepts', pct: analysis ? Math.min(100, Math.round(hasSkill(['dsa', 'sql', 'git', 'api', 'rest', 'testing', 'debugging', 'algorithms', 'data structures']) / 9 * 100) + 30) : 0, cls: 'green' },
        { label: 'Tools & Platforms', pct: analysis ? Math.min(100, Math.round(hasSkill(['docker', 'aws', 'gcp', 'kubernetes', 'linux', 'git', 'ci/cd', 'terraform']) / 8 * 100) + 10) : 0, cls: 'purple' },
    ]

    const METRICS = [
        { icon: <Activity size={14} />, label: 'Readiness Score', value: analysis ? `${score}%` : '--', sub: analysis ? (chartHistory.length > 1 ? `+${score - chartHistory[0].value}% overall` : '+5% this week') : 'No analysis yet', pct: score, bg: 'rgba(59,130,246,0.12)', col: '#3b82f6' },
        { icon: <Lightbulb size={14} />, label: 'Core Skill Coverage', value: analysis ? `${corePct}%` : '--', sub: analysis ? `${skills.length} skills detected` : 'Upload resume', pct: corePct, bg: 'rgba(34,211,238,0.12)', col: '#22d3ee' },
        { icon: <AlertCircle size={14} />, label: 'Missing Critical Skills', value: analysis ? String(missingCount) : '--', sub: analysis ? `${Math.min(missingCount, 3)} high priority` : 'Pending analysis', pct: analysis ? Math.min(100, (missingCount / 10) * 100) : 0, bg: 'rgba(245,158,11,0.12)', col: '#f59e0b' },
        { icon: <Activity size={14} />, label: 'Interview Readiness', value: analysis ? readiness : '--', sub: analysis ? (analytics?.total_analyses ? `${analytics.total_analyses} total analyses` : 'Level 2 of 4') : 'Ready to start', pct: analysis ? score * 0.8 : 0, bg: 'rgba(167,139,250,0.12)', col: '#a78bfa' },
    ]

    const TOP_MISSING = analysis ? missingCore.slice(0, 5).map((skill, i) => ({
        skill, priority: i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low'
    })) : []


    return (
        <div className="page-content">
            {/* Hero */}
            <div className="hero">
                <h1>Measure. Improve. <span className="accent">Achieve.</span></h1>
                <p>
                    {user ? `Welcome back, ${user.name}! ` : ''}
                    AI-powered job readiness intelligence for engineering students.
                </p>
                <button className="btn btn--primary" onClick={() => navigate('/resume-analyzer')}>
                    <Upload size={14} /> {analysis ? 'Re-Upload Resume' : 'Upload Resume'}
                </button>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid" style={{ marginBottom: 32 }}>
                {METRICS.map((m, i) => (
                    <div key={i} className="metric-card" style={{ background: m.bg }}>
                        <div className="metric-card__icon" style={{ background: `${m.col}22`, color: m.col }}>{m.icon}</div>
                        <div className="metric-card__value">{m.value}</div>
                        <div className="metric-card__label">{m.label}</div>
                        <div className="metric-card__bar">
                            <div className="metric-card__bar-fill" style={{ width: `${m.pct}%`, background: m.col }} />
                        </div>
                        <div className="metric-card__sub" style={{ opacity: 0.7 }}>{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* Skill Coverage + Skill Gaps + Role Model */}
            <div className="grid-3 mb-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <div className="card" style={{ height: '100%' }}>
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
                    {!analysis && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 8, marginTop: 10 }}>Pending Analysis</div>}
                </div>

                <div className="card" style={{ height: '100%' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="card-title">Skill Gaps</div>
                        {analysis && <button className="btn btn--ghost btn--sm" style={{ padding: '0 8px' }} onClick={() => navigate('/skill-gap')}>Gaps →</button>}
                    </div>
                    <div className="card-subtitle mb-16">Top critical skills to focus on</div>
                    {TOP_MISSING.length > 0 ? (
                        TOP_MISSING.map((item, i) => (
                            <div className="gap-row" key={i}>
                                <span className="gap-row__num">{i + 1}</span>
                                <span className="gap-row__name">{item.skill}</span>
                                <span className={`badge badge--${item.priority.toLowerCase()}`}>{item.priority}</span>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                            <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                            <p style={{ fontSize: 13, margin: 0 }}>Analyze a resume to see skill gaps</p>
                        </div>
                    )}
                </div>

                {/* AI Recommendation (Only show if there is a role mismatch OR current score is very low) */}
                {bestFit && (bestFit.predicted_role !== analysis?.role || (score < 50 && bestFit.confidence > 0.6)) && (
                    <div className="card" style={{ background: 'linear-gradient(145deg, var(--bg-card), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                        <div className="flex items-center justify-between mb-16">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ background: 'var(--blue)', color: 'white', padding: 6, borderRadius: 8 }}>
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <div className="card-title" style={{ fontSize: 16 }}>AI Best Fit Recommendation</div>
                                    <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 800, textTransform: 'uppercase' }}>Cross-Role Comparison</div>
                                </div>
                            </div>
                            <div className="badge badge--medium" style={{ fontSize: 9 }}>
                                SKILL SIMILARITY
                            </div>
                        </div>

                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)', flex: 1 }}>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Your highest potential role is:</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>{bestFit.predicted_role}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                        <div style={{ width: `${(bestFit.confidence ?? 0.85) * 100}%`, height: '100%', background: 'var(--green)', borderRadius: 3 }} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)', minWidth: 60, textAlign: 'right' }}>{Math.round((bestFit.confidence ?? 0.85) * 100)}% Match</span>
                                </div>

                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                    {bestFit.reasoning || `Based on your skill profile, you are a much stronger match for ${bestFit.predicted_role} than your currently selected path.`}
                                </p>
                            </div>

                            <button
                                className="btn btn--primary btn--sm"
                                onClick={() => navigate('/resume-analyzer')}
                                style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                            >
                                Switch to Recommended Path →
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
