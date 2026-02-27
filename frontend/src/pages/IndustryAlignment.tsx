import { useResume, getIndustryAlignment } from '../context/ResumeContext'
import { Building2, Monitor, Rocket } from 'lucide-react'

export default function IndustryAlignment() {
    const { analysis } = useResume()
    const score = analysis?.final_score ?? 72
    const align = getIndustryAlignment(score)

    const ROWS = [
        {
            Icon: Building2,
            title: 'Service-Based Companies',
            sub: 'TCS, Infosys, Wipro, Cognizant',
            pct: align.service,
            cls: 'blue',
        },
        {
            Icon: Monitor,
            title: 'Product-Based Companies',
            sub: 'Google, Microsoft, Amazon, Meta',
            pct: align.product,
            cls: 'cyan',
        },
        {
            Icon: Rocket,
            title: 'Startup Roles',
            sub: 'Early-stage, Series A, Growth',
            pct: align.startup,
            cls: 'green',
        },
    ]

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Industry Alignment</div>
                <div className="page-subtitle">How your profile matches different company types</div>
            </div>

            {ROWS.map((row, i) => {
                const Icon = row.Icon
                return (
                    <div className="industry-row" key={i}>
                        <div className="industry-row__header">
                            <div className="industry-row__info">
                                <div className="industry-row__icon"><Icon size={18} /></div>
                                <div>
                                    <div className="industry-row__title">{row.title}</div>
                                    <div className="industry-row__sub">{row.sub}</div>
                                </div>
                            </div>
                            <div className="industry-row__pct">{row.pct}%</div>
                        </div>
                        <div className="progress-track" style={{ height: 8 }}>
                            <div className={`progress-fill progress-fill--${row.cls}`} style={{ width: `${row.pct}%` }} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
