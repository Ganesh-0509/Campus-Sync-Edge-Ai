import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MiniLineChart from '../components/MiniLineChart'
import { useResume } from '../context/ResumeContext'
import { loadHistory, getHistoryOrDemo } from '../utils/history'
import { Star, Award, Zap, Trophy, Pin, Sparkles, BookOpen } from 'lucide-react'
import StudyHub from '../components/StudyHub'


const HISTORY = [
    { label: 'Jan', value: 38 }, { label: 'Feb', value: 43 }, { label: 'Mar', value: 50 },
    { label: 'Apr', value: 58 }, { label: 'May', value: 65 }, { label: 'Jun', value: 74 },
]

const HEATMAP = [
    { month: 'Month 1', skills: ['DSA', 'Python', 'React', 'SQL', 'Git'], bright: 0 },
    { month: 'Month 2', skills: ['DSA', 'Python', 'React', 'SQL', 'Git'], bright: 2 },
    { month: 'Month 3', skills: ['DSA', 'Python', 'React', 'SQL', 'Git'], bright: 5 },
]

const MILESTONES = [
    { icon: Star, label: 'First Resume Upload', date: 'Jan 15', done: true },
    { icon: Award, label: 'Reached 50% Score', date: 'Mar 22', done: true },
    { icon: Zap, label: 'Placement Ready', date: 'May 10', done: true },
    { icon: Trophy, label: 'Interview Ready', date: '—', done: false },
]

export default function ProgressTracking() {
    const navigate = useNavigate()
    const { analysis, masteredSkills, markSkillMastered } = useResume()
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
    const score = analysis?.final_score ?? 74
    const realHistory = loadHistory()
    const hist = getHistoryOrDemo(realHistory)

    // Load pinned notes
    const pinnedSkills: string[] = JSON.parse(localStorage.getItem('pinned_notes') || '[]')

    const allSkills = [
        ...(analysis?.detected_skills ?? []).map(s => s.toLowerCase()),
        ...masteredSkills.map(s => s.toLowerCase())
    ]

    // Skill Categories for the Heatmap rows
    const CATEGORIES = [
        { label: 'Languages', code: 'LANG', color: '#3b82f6', skills: ['python', 'java', 'javascript', 'typescript', 'c', 'cpp', 'go', 'rust', 'php', 'ruby'] },
        { label: 'Core CS', code: 'CORE', color: '#22c55e', skills: ['dsa', 'sql', 'git', 'api', 'rest', 'os', 'networks', 'database', 'security'] },
        { label: 'Frameworks', code: 'FRAME', color: '#22d3ee', skills: ['react', 'fastapi', 'flask', 'django', 'spring', 'express', 'next', 'vue', 'angular'] },
        { label: 'DevOps & Tools', code: 'TOOLS', color: '#a78bfa', skills: ['docker', 'kubernetes', 'aws', 'linux', 'git', 'ci/cd', 'terraform', 'jenkins', 'cloud'] }
    ]

    const statsGrid = CATEGORIES.map(cat => {
        const mastered = cat.skills.filter(s => allSkills.includes(s))
        const intensity = Array.from({ length: 12 }).map((_, i) => {
            const mCount = mastered.length
            if (i < 3) return mCount > 0 ? 1 : 0
            if (i < 7) return mCount > 1 ? 2 : 1
            if (i < 10) return mCount > 2 ? 3 : 2
            return mCount > 4 ? 4 : 3
        })
        return { ...cat, mastered, intensity }
    })

    const totalMastered = CATEGORIES.reduce((acc, cat) => acc + cat.skills.filter(s => allSkills.includes(s)).length, 0)

    const nextSkill = (analysis?.missing_core_skills ?? []).find(s => !masteredSkills.includes(s)) ?? 'Advanced Data Structures'

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <div className="page-title">Growth Analytics</div>
                    <div className="page-subtitle">Measuring your transition from student to professional</div>
                </div>
                <div className="badge badge--high" style={{ padding: '8px 16px', borderRadius: 12 }}>
                    {totalMastered} Core Skills Mastered
                </div>
            </div>

            <div className="grid-3 mb-16">
                {/* Explainer Card */}
                <div className="card" style={{ background: 'rgba(59,130,246,0.03)', border: '1px dashed rgba(59,130,246,0.2)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>💡</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            <strong>Analysis Guide:</strong> This heatmap tracks your skill density. square darken, signaling higher **Placement Readiness**.
                        </div>
                    </div>
                </div>

                {/* Next Step Card */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.1) 0%, rgba(59,130,246,0.05) 100%)', border: '1px solid rgba(34,211,238,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 4 }}>Strategic Focus</div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>Mastering <span style={{ color: 'var(--blue)' }}>{nextSkill}</span></div>
                        </div>
                        <button className="btn btn--primary btn--sm" onClick={() => navigate('/improvement-plan')}>View Plan</button>
                    </div>
                </div>

                {/* Pinned Skills Summary Card */}
                <div className="card" style={{ background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <div className="flex items-center gap-12">
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Pin size={16} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SAVED CONCEPTS</div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{pinnedSkills.length} Items Pinned</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Historical Score */}
            <div className="grid-2 mb-16">
                <div className="card">
                    <div className="flex items-center justify-between mb-12">
                        <div className="card-title">Readiness Growth Velocity</div>
                        <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>+{(hist[hist.length - 1].value - hist[0].value)} pts gain</div>
                    </div>
                    <MiniLineChart data={hist} height={140} color="#3b82f6" />
                </div>

                {/* Pinned Study Materials */}
                <div className="card">
                    <div className="card-title mb-16">Pinned Study Materials</div>
                    {pinnedSkills.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, overflowY: 'auto', maxHeight: 160 }}>
                            {pinnedSkills.map(s => (
                                <button key={s} className="ws-nav-item" style={{ height: 'auto', textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => setSelectedSkill(s)}>
                                    <BookOpen size={16} className="text-blue" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{s}</div>
                                        <div style={{ fontSize: 10, opacity: 0.6 }}>Reference Material</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                            <Pin size={32} />
                            <div style={{ fontSize: 12, marginTop: 8 }}>No pinned notes yet.</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid-2">
                {/* Advanced Heatmap */}
                <div className="card">
                    <div className="flex items-center justify-between mb-24">
                        <div className="card-title">Skill Density Matrix</div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>Dormant</span>
                            {[0, 1, 2, 3, 4].map(v => (
                                <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(34,211,238, ${0.1 + v * 0.22})` }} />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {statsGrid.map((row, ri) => (
                            <div key={ri} className="heatmap-row-container">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: row.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ color: 'var(--text-primary)' }}>{row.label}</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                        {row.mastered.length} / {row.skills.length} skills
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
                                    {row.intensity.map((lev, ci) => (
                                        <div
                                            key={ci}
                                            title={`Category: ${row.label}\nStatus: ${lev === 0 ? 'Not found' : 'Level ' + lev}\nDetected: ${row.mastered.join(', ') || 'None'}`}
                                            style={{
                                                aspectRatio: '1/1', borderRadius: 2,
                                                background: lev === 0 ? 'rgba(255,255,255,0.03)' : `rgba(34,211,238, ${0.1 + lev * 0.22})`,
                                                transition: 'all 0.3s',
                                                cursor: 'help'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 24, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Detected Skills Mastery</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {allSkills.slice(0, 10).map((s: string) => (
                                <div key={s} style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 4, color: 'var(--cyan)' }}>
                                    {s}
                                </div>
                            ))}
                            {allSkills.length > 10 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{allSkills.length - 10} more</span>}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-title mb-16">Career Milestones</div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.05)' }} />
                        {[
                            { icon: Star, label: 'First Resume Upload', done: true },
                            { icon: Award, label: 'Reached 50% Score', done: true },
                            { icon: Zap, label: 'Placement Ready', done: true },
                            { icon: Trophy, label: 'Interview Ready', done: false },
                        ].map((m, i) => {
                            const Icon = m.icon
                            return (
                                <div className="milestone" key={i} style={{ marginBottom: 24, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: m.done ? 'var(--green-glow)' : '#1e293b',
                                        zIndex: 2
                                    }}>
                                        <Icon size={14} color={m.done ? '#fff' : 'rgba(255,255,255,0.3)'} />
                                    </div>
                                    <div style={{ marginLeft: 16 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</div>
                                        <div style={{ fontSize: 11, opacity: 0.6 }}>{m.done ? 'Completed' : 'Upcoming'}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {selectedSkill && (
                <StudyHub
                    skill={selectedSkill}
                    onClose={() => setSelectedSkill(null)}
                    onVerified={(s) => markSkillMastered(s)}
                />
            )}
        </div>
    )
}
