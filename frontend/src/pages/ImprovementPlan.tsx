import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getMarketForecast, type ForecastResult } from '../api/client'
import { useResume } from '../context/ResumeContext'
import { CheckCircle, Circle, Clock, BookOpen, ExternalLink, Lock, Flame, PlayCircle, Trophy, Pin, Sparkles } from 'lucide-react'
import StudyHub from '../components/StudyHub'

/* ─────────────────────────────────────────────────────────────
   Daily Planning Logic: Split skills based on time allocation
───────────────────────────────────────────────────────────── */
interface PlanItem {
    id: string
    title: string
    skill: string
    priority: 'Critical' | 'High' | 'Medium'
    level: number
    durationMinutes: number
    resources: { link: string; title: string; time: string }[]
    subtasks: string[]
}

function buildAdaptivePlan(
    missingCore: string[],
    missingOptional: string[]
): PlanItem[] {
    const items: PlanItem[] = []

    // Level 1: Critical Core (2h each)
    missingCore.slice(0, 3).forEach((s, i) => {
        items.push({
            id: `core-${i}`,
            title: `Master ${s}`,
            skill: s,
            priority: 'Critical',
            level: 1,
            durationMinutes: 120,
            resources: [],
            subtasks: [`Complete AI Study Guide for ${s}`, `Pass ${s} Verification Quiz`]
        })
    })

    // Level 2: High Priority (1.5h each)
    missingCore.slice(3, 6).forEach((s, i) => {
        items.push({
            id: `high-${i}`,
            title: `Deep Dive: ${s}`,
            skill: s,
            priority: 'High',
            level: 2,
            durationMinutes: 90,
            resources: [],
            subtasks: [`Understand Advanced ${s} concepts`, `Implement a project using ${s}`]
        })
    })

    // Level 3: Optional/Medium (1h each)
    missingOptional.slice(0, 4).forEach((s, i) => {
        items.push({
            id: `med-${i}`,
            title: `Explore ${s}`,
            skill: s,
            priority: 'Medium',
            level: 3,
            durationMinutes: 60,
            resources: [],
            subtasks: [`Basic syntax and use cases of ${s}`, `Compare ${s} with alternatives`]
        })
    })

    return items
}

export default function ImprovementPlan() {
    const { analysis, completedTasks, masteredSkills, dailyCommitment, setDailyCommitment, markSkillMastered } = useResume()
    const location = useLocation()
    const highlightSkill = (location.state as any)?.highlightSkill

    const role = analysis?.role ?? 'Software Developer'
    const missingCore = analysis?.missing_core_skills ?? ['System Design', 'Docker', 'DSA']
    const missingOpt = analysis?.missing_optional_skills ?? ['React', 'AWS']

    const [plan] = useState(() => buildAdaptivePlan(missingCore, missingOpt))
    const [activeStudy, setActiveStudy] = useState<string | null>(null)
    const [aiForecast, setAiForecast] = useState<ForecastResult | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        getMarketForecast(role, missingCore).then(setAiForecast).catch(() => { }).finally(() => setLoading(false))
    }, [role])

    // Level-based locking logic
    const getLevelStatus = (level: number) => {
        if (level === 1) return 'open'
        const prevLevelItems = plan.filter(p => p.level === level - 1)
        const completedPrev = prevLevelItems.every(p => masteredSkills.includes(p.skill.toLowerCase()))
        return completedPrev ? 'open' : 'locked'
    }

    // Daily distribution
    const distributedPlan: Array<{ day: number; tasks: PlanItem[] }> = []
    let currentDay = 1
    let dayMinutes = 0
    const maxMinutes = dailyCommitment * 60

    plan.forEach(item => {
        if (dayMinutes + item.durationMinutes > maxMinutes && distributedPlan.length > 0) {
            currentDay++
            dayMinutes = 0
        }

        let dayGroup = distributedPlan.find(d => d.day === currentDay)
        if (!dayGroup) {
            dayGroup = { day: currentDay, tasks: [] }
            distributedPlan.push(dayGroup)
        }
        dayGroup.tasks.push(item)
        dayMinutes += item.durationMinutes
    })

    const totalMastered = plan.filter(p => masteredSkills.includes(p.skill.toLowerCase())).length
    const progressPct = Math.round((totalMastered / plan.length) * 100)

    return (
        <div className="page-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                        <div>
                            <h1 className="page-title">Adaptive Learning Path</h1>
                            <p className="page-subtitle">Personalized {role} roadmap powered by AI</p>
                        </div>

                        <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(59, 130, 246, 0.05)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>DAILY COMMITMENT</div>
                            <select
                                value={dailyCommitment}
                                onChange={(e) => setDailyCommitment(Number(e.target.value))}
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'white', padding: '4px 8px' }}
                            >
                                <option value={1}>1 Hour / day</option>
                                <option value={2}>2 Hours / day</option>
                                <option value={4}>4 Hours / day</option>
                                <option value={8}>Full-time (8h)</option>
                            </select>
                        </div>
                    </div>

                    {/* AI Insights Card */}
                    {aiForecast && (
                        <div className="hero" style={{ padding: '24px', marginBottom: 24, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📈</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span className="badge badge--low">AI MARKET FORECAST</span>
                                        <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>+{aiForecast.growth_pct}% Opportunity</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>{aiForecast.summary}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Roadmap */}
                    <div className="roadmap-container">
                        {distributedPlan.map(({ day, tasks }) => (
                            <div key={day} className="day-block" style={{ marginBottom: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', fontWeight: 800, fontSize: 12 }}>
                                        D{day}
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>Learning Schedule</div>
                                    <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                                        {tasks.reduce((acc, t) => acc + t.durationMinutes, 0)} mins total
                                    </div>
                                </div>

                                <div className="tasks-grid" style={{ display: distributedPlan.length > 1 ? 'grid' : 'block', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                                    {tasks.map(task => {
                                        const status = getLevelStatus(task.level)
                                        const isMastered = masteredSkills.includes(task.skill.toLowerCase())
                                        const isLocked = status === 'locked' && !isMastered

                                        return (
                                            <div
                                                key={task.id}
                                                className={`card task-card ${isLocked ? 'locked' : ''} ${isMastered ? 'completed' : ''}`}
                                                style={{
                                                    position: 'relative', opacity: isLocked ? 0.5 : 1, transition: 'all 0.3s',
                                                    border: isMastered ? '1px solid var(--green)' : highlightSkill === task.skill ? '2px solid var(--blue)' : '1px solid var(--border)',
                                                    background: isMastered ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                    <span className={`badge ${task.priority === 'Critical' ? 'badge--high' : task.priority === 'High' ? 'badge--medium' : 'badge--blue'}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                                                        <Clock size={12} /> {task.durationMinutes}m
                                                    </span>
                                                </div>

                                                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{task.title}</h3>

                                                <div style={{ marginBottom: 16 }}>
                                                    {task.subtasks.map((st, si) => (
                                                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--blue)' }} /> {st}
                                                        </div>
                                                    ))}
                                                </div>

                                                {isLocked ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                                        <Lock size={14} /> Level {task.level} Locked
                                                    </div>
                                                ) : isMastered ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, fontWeight: 700 }}>
                                                        <Trophy size={16} /> Verified Mastery
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn btn--primary btn--sm"
                                                        style={{ width: '100%', justifyContent: 'center' }}
                                                        onClick={() => setActiveStudy(task.skill)}
                                                    >
                                                        <PlayCircle size={16} /> Start AI Study Hub
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Study Hub Overlay */}

                </div>

                {/* ── Knowledge Repository Sidebar ── */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card" style={{ padding: 20, background: 'rgba(59, 130, 246, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <Pin size={18} className="text-blue" />
                            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Pinned Library</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {JSON.parse(localStorage.getItem('pinned_notes') || '[]').length > 0 ? (
                                JSON.parse(localStorage.getItem('pinned_notes') || '[]').map((s: string) => (
                                    <button
                                        key={s}
                                        className="ws-nav-item"
                                        style={{ height: 'auto', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '10px 12px' }}
                                        onClick={() => setActiveStudy(s)}
                                    >
                                        <BookOpen size={14} className="text-blue" />
                                        <span style={{ fontSize: 12, fontWeight: 600 }}>{s}</span>
                                    </button>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.4 }}>
                                    <p style={{ fontSize: 11 }}>Save notes to see them here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 20, background: 'rgba(34, 211, 238, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <Sparkles size={18} style={{ color: 'var(--cyan)' }} />
                            <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>AI Tutor Tip</h3>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Focus on "Critical" skills first to maximize your Placement Readiness score upgrade.
                        </p>
                    </div>
                </aside>
            </div>

            {/* Global Stats Footer */}
            <div className="card" style={{ marginTop: 40, background: 'linear-gradient(90deg, #1e293b, #0d1117)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{progressPct}%</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Roadmap Progress</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="progress-track" style={{ height: 10 }}>
                            <div className="progress-fill progress-fill--blue" style={{ width: `${progressPct}%` }} />
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                            You have verified <strong style={{ color: 'var(--blue)' }}>{totalMastered}</strong> critical skill gaps in your profile.
                        </p>
                    </div>
                    <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Flame size={20} color="var(--orange)" />
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>2 Day Streak</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Keep going!</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Study Hub Overlay */}
            {activeStudy && (
                <StudyHub
                    skill={activeStudy}
                    onClose={() => setActiveStudy(null)}
                    onVerified={(s) => markSkillMastered(s.toLowerCase())}
                />
            )}
        </div>
    )
}
