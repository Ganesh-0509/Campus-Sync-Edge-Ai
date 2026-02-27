import MiniLineChart from '../components/MiniLineChart'
import { useResume } from '../context/ResumeContext'
import { loadHistory, getHistoryOrDemo } from '../utils/history'
import { Star, Award, Zap, Trophy } from 'lucide-react'


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
    const { analysis } = useResume()
    const score = analysis?.final_score ?? 74
    const realHistory = loadHistory()
    const hist = getHistoryOrDemo(realHistory)

    // Build heatmap from real detected_skills
    const detectedSkills = analysis?.detected_skills ?? []
    const heatmapSkills = detectedSkills.length >= 5
        ? detectedSkills.slice(0, 5).map(s => s.charAt(0).toUpperCase() + s.slice(1))
        : ['DSA', 'Python', 'React', 'SQL', 'Git']
    const HEATMAP = [
        { month: 'Month 1', skills: heatmapSkills, bright: 0 },
        { month: 'Month 2', skills: heatmapSkills, bright: 2 },
        { month: 'Month 3', skills: heatmapSkills, bright: heatmapSkills.length },
    ]

    // Milestones: auto-trigger from real history
    const firstUploadDate = realHistory[0]?.label ?? '—'
    const hit50 = realHistory.find(h => h.value >= 50)
    const hitPlacement = realHistory.find(h => h.value >= 60)
    const hitInterview = realHistory.find(h => h.value >= 80)
    const MILESTONES = [
        { icon: Star, label: 'First Resume Upload', date: firstUploadDate, done: realHistory.length > 0 },
        { icon: Award, label: 'Reached 50% Score', date: hit50?.label ?? '—', done: !!hit50 },
        { icon: Zap, label: 'Placement Ready', date: hitPlacement?.label ?? '—', done: !!hitPlacement },
        { icon: Trophy, label: 'Interview Ready', date: hitInterview?.label ?? '—', done: !!hitInterview },
    ]

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Progress Tracking</div>
                <div className="page-subtitle">Track your growth over time</div>
            </div>

            {/* Historical Score */}
            <div className="card mb-16">
                <div className="card-title mb-12">Historical Score</div>
                <MiniLineChart data={hist} height={130} color="#3b82f6" />
            </div>

            {/* Heatmap + Milestones */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-title mb-16">Skill Improvement Heatmap</div>
                    {HEATMAP.map((row, ri) => (
                        <div className="heatmap-row" key={ri}>
                            <div className="heatmap-label">{row.month}</div>
                            <div className="heatmap-cells">
                                {row.skills.map((s, si) => (
                                    <span
                                        key={si}
                                        className={`heatmap-cell ${si < row.bright ? 'heatmap-cell--dim' : 'heatmap-cell--bright'}`}
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="card-title mb-16">Milestone Achievements</div>
                    {MILESTONES.map((m, i) => {
                        const Icon = m.icon
                        return (
                            <div className="milestone" key={i}>
                                <div className={`milestone__icon ${m.done ? 'done' : 'pending'}`}>
                                    <Icon size={14} />
                                </div>
                                <div className="milestone__info">
                                    <div className="milestone__title">{m.label}</div>
                                    <div className="milestone__date">{m.date}</div>
                                </div>
                                {m.done && <span className="milestone__check">✓</span>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
