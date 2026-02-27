import { useResume } from '../context/ResumeContext'
import { TrendingUp } from 'lucide-react'

export default function ResumeComparison() {
    const { analysis, previousAnalysis } = useResume()

    const curr = analysis
    const prev = previousAnalysis

    const currScore = curr?.final_score ?? 72
    const prevScore = prev?.final_score ?? 58
    const currSkills = curr?.detected_skills ?? ['Python', 'Java', 'SQL', 'HTML/CSS', 'Git', 'React', 'Node.js', 'Docker']
    const prevSkills = prev?.detected_skills ?? ['Python', 'Java', 'SQL', 'HTML/CSS', 'Git']

    const prevSet = new Set(prevSkills.map(s => s.toLowerCase()))
    const currSet = new Set(currSkills.map(s => s.toLowerCase()))

    const shared = currSkills.filter(s => prevSet.has(s.toLowerCase()))
    const added = currSkills.filter(s => !prevSet.has(s.toLowerCase()))
    const removed = prevSkills.filter(s => !currSet.has(s.toLowerCase()))

    const diff = currScore - prevScore

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Resume Comparison</div>
                <div className="page-subtitle">Compare your resume versions side by side</div>
            </div>

            <div className="grid-2 mb-16">
                {/* Previous */}
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <div className="card-title">Previous Resume</div>
                        <span className="compare-score">{prevScore}%</span>
                    </div>
                    {[...shared, ...removed].slice(0, 8).map(s => (
                        <div
                            key={s}
                            className={`compare-skill-item ${removed.includes(s) ? 'compare-skill-item--removed' : 'compare-skill-item--neutral'}`}
                        >
                            {removed.includes(s) ? '− ' : '• '}{s}
                        </div>
                    ))}
                </div>

                {/* Current */}
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <div className="card-title">Current Resume</div>
                        <span className="compare-score">{currScore}%</span>
                    </div>
                    {shared.slice(0, 5).map(s => (
                        <div key={s} className="compare-skill-item compare-skill-item--neutral">• {s}</div>
                    ))}
                    {added.slice(0, 4).map(s => (
                        <div key={s} className="compare-skill-item compare-skill-item--added">+ {s}</div>
                    ))}
                </div>
            </div>

            {/* Score difference */}
            <div className="card">
                <div className="card-title mb-12">Score Difference</div>
                <div className="flex items-center gap-12">
                    <TrendingUp size={20} color="var(--green)" />
                    <div>
                        <div className={`diff-positive`} style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {diff >= 0 ? `+${diff}%` : `${diff}%`} improvement from previous version
                        </div>
                        <div className="diff-info">
                            + {added.length} skills added &nbsp;&nbsp; − {removed.length} skills removed
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
