import { useState, useEffect } from 'react'
import { useResume } from '../context/ResumeContext'
import { CheckCircle, Circle, Clock, BookOpen, ExternalLink } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   Resource database per skill — curated, real links
───────────────────────────────────────────────────────────── */
const SKILL_RESOURCES: Record<string, { link: string; title: string; time: string }[]> = {
    'docker': [{ link: 'https://docs.docker.com/get-started/', title: 'Docker Official Quickstart', time: '90 min' }, { link: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', title: 'Docker in 100 Seconds', time: '15 min' }],
    'kubernetes': [{ link: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', title: 'K8s Basics', time: '2 hr' }, { link: 'https://www.youtube.com/watch?v=X48VuDVv0do', title: 'K8s Full Course', time: '3 hr' }],
    'system design': [{ link: 'https://github.com/donnemartin/system-design-primer', title: 'System Design Primer (GitHub)', time: '3 hr' }, { link: 'https://www.youtube.com/watch?v=i53Gi_K3o7I', title: 'System Design Interview Concepts', time: '1 hr' }],
    'aws': [{ link: 'https://aws.amazon.com/getting-started/', title: 'AWS Getting Started', time: '2 hr' }, { link: 'https://www.youtube.com/watch?v=3hLmDS179YE', title: 'AWS Full Course', time: '2 hr' }],
    'react': [{ link: 'https://react.dev/learn', title: 'Official React Docs (Learn)', time: '3 hr' }, { link: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', title: 'React JS Crash Course', time: '1.5 hr' }],
    'typescript': [{ link: 'https://www.typescriptlang.org/docs/handbook/intro.html', title: 'TypeScript Handbook', time: '2 hr' }, { link: 'https://www.youtube.com/watch?v=BCg4U1FzODs', title: 'TypeScript Crash Course', time: '1 hr' }],
    'python': [{ link: 'https://docs.python.org/3/tutorial/', title: 'Python Official Tutorial', time: '3 hr' }, { link: 'https://www.youtube.com/watch?v=eWRfhZUzrAc', title: 'Python Full Course FCC', time: '4 hr' }],
    'sql': [{ link: 'https://mode.com/sql-tutorial/', title: 'Mode Analytics SQL Tutorial', time: '2 hr' }, { link: 'https://sqlzoo.net/', title: 'SQLZoo Interactive Practice', time: '2 hr' }],
    'machine learning': [{ link: 'https://developers.google.com/machine-learning/crash-course', title: 'Google ML Crash Course', time: '15 hr' }, { link: 'https://www.youtube.com/watch?v=i_LwzRVP7bg', title: 'ML with Python (FCC)', time: '2 hr' }],
    'deep learning': [{ link: 'https://www.deeplearning.ai/courses/deep-learning-specialization/', title: 'DeepLearning.AI Specialization', time: '40 hr' }, { link: 'https://www.youtube.com/watch?v=ER2It2mIagI', title: 'Deep Learning Fundamentals', time: '2 hr' }],
    'ci/cd': [{ link: 'https://docs.github.com/en/actions/quickstart', title: 'GitHub Actions Quickstart', time: '1 hr' }, { link: 'https://www.youtube.com/watch?v=mFFXuXjVgkU', title: 'CI/CD Pipeline Tutorial', time: '1 hr' }],
    'linux': [{ link: 'https://linuxjourney.com/', title: 'Linux Journey (Interactive)', time: '3 hr' }, { link: 'https://www.youtube.com/watch?v=ZtqBQ68cfJc', title: 'Linux Command Line Basics', time: '1.5 hr' }],
    'terraform': [{ link: 'https://developer.hashicorp.com/terraform/tutorials', title: 'Terraform Tutorials', time: '2 hr' }, { link: 'https://www.youtube.com/watch?v=l5k1ai_GBDE', title: 'Terraform Crash Course', time: '2 hr' }],
    'graphql': [{ link: 'https://graphql.org/learn/', title: 'GraphQL Official Docs', time: '2 hr' }, { link: 'https://www.youtube.com/watch?v=ed8SzALpx1Q', title: 'GraphQL Full Tutorial', time: '1.5 hr' }],
    'microservices': [{ link: 'https://microservices.io/patterns/index.html', title: 'Microservices Patterns', time: '2 hr' }, { link: 'https://www.youtube.com/watch?v=lL_j7ilk7rc', title: 'Microservices Architecture', time: '1 hr' }],
    'testing': [{ link: 'https://jestjs.io/docs/getting-started', title: 'Jest Getting Started', time: '1 hr' }, { link: 'https://www.youtube.com/watch?v=Jv2uxzhPFl4', title: 'Testing JavaScript Apps', time: '1 hr' }],
    'dsa': [{ link: 'https://neetcode.io/', title: 'NeetCode Roadmap (Free)', time: '20 hr' }, { link: 'https://www.youtube.com/watch?v=pkYVOmU3MgA', title: 'DS & Algorithms Crash Course', time: '2 hr' }],
    'api': [{ link: 'https://restfulapi.net/', title: 'REST API Design Guide', time: '1 hr' }, { link: 'https://www.youtube.com/watch?v=GZvSYJDk-us', title: 'REST API Tutorial', time: '1 hr' }],
    'git': [{ link: 'https://learngitbranching.js.org/', title: 'Learn Git Branching (Interactive)', time: '1.5 hr' }, { link: 'https://www.youtube.com/watch?v=RGOj5yH7evk', title: 'Git & GitHub Crash Course', time: '1 hr' }],
    'redis': [{ link: 'https://redis.io/learn', title: 'Redis Learn', time: '2 hr' }, { link: 'https://www.youtube.com/watch?v=jgpVdJB2sKQ', title: 'Redis Crash Course', time: '1 hr' }],
    'mongodb': [{ link: 'https://www.mongodb.com/docs/manual/tutorial/getting-started/', title: 'MongoDB Quickstart', time: '1.5 hr' }, { link: 'https://www.youtube.com/watch?v=-bt_y4Loofg', title: 'MongoDB Crash Course', time: '1 hr' }],
    'node.js': [{ link: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', title: 'Node.js Official Docs', time: '2 hr' }, { link: 'https://www.youtube.com/watch?v=f2EqECiTBL8', title: 'Node.js Full Course', time: '2 hr' }],
}

const DEFAULT_RESOURCE = [
    { link: 'https://www.youtube.com/results?search_query=', title: 'YouTube Tutorial', time: '1 hr' },
    { link: 'https://roadmap.sh', title: 'Roadmap.sh Guide', time: '30 min' },
]

/* Generate a real dynamic improvement plan from missing skills */
function buildPlan(
    missingCore: string[],
    missingOptional: string[],
    role: string,
): Array<{
    days: string
    title: string
    skill: string
    priority: 'Critical' | 'High' | 'Medium'
    duration: string
    resources: { link: string; title: string; time: string }[]
    subtasks: string[]
}> {
    const items: ReturnType<typeof buildPlan> = []
    let day = 1

    const addItem = (
        skill: string,
        priority: 'Critical' | 'High' | 'Medium',
        days: number,
    ) => {
        const key = skill.toLowerCase()
        const resources = SKILL_RESOURCES[key] ?? DEFAULT_RESOURCE.map(r => ({
            ...r,
            link: key === 'youtube tutorial' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(skill)}` : r.link,
        }))

        const subtasks = [
            `Read/watch the first resource for ${skill}`,
            `Complete 3 practice exercises`,
            `Add ${skill} to your resume project`,
        ]

        items.push({
            days: day === day + days - 1 ? `Day ${day}` : `Day ${day}–${day + days - 1}`,
            title: `Master ${skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
            skill,
            priority,
            duration: `${days * 90} min est.`,
            resources,
            subtasks,
        })
        day += days
    }

    // Critical: missing core skills (2 days each)
    missingCore.slice(0, 3).forEach(s => addItem(s, 'Critical', 2))

    // High: remaining core (1 day each)
    missingCore.slice(3, 5).forEach(s => addItem(s, 'High', 1))

    // Medium: optional skills (1 day each)
    missingOptional.slice(0, 2).forEach(s => addItem(s, 'Medium', 1))

    // Final day: Integration project
    items.push({
        days: `Day ${day}`,
        title: `Build a ${role} Portfolio Project`,
        skill: 'project',
        priority: 'High',
        duration: '3–4 hr',
        resources: [
            { link: 'https://github.com/practical-tutorials/project-based-learning', title: 'Project-Based Learning (GitHub)', time: '3–4 hr' },
            { link: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(role + ' project tutorial'), title: `${role} Project Tutorial`, time: '2 hr' },
        ],
        subtasks: [
            `Apply the skills you learned this week`,
            `Build one complete feature end-to-end`,
            `Push to GitHub with a clear README`,
            `Add the project to your resume`,
        ],
    })

    return items
}

const LS_KEY = 'cse_improvement_checks'

export default function ImprovementPlan() {
    const { analysis } = useResume()

    const role = analysis?.role ?? 'Software Developer'
    const missingCore = analysis?.missing_core_skills ?? ['System Design', 'Docker', 'DSA', 'CI/CD', 'TypeScript']
    const missingOpt = analysis?.missing_optional_skills ?? ['React', 'AWS']
    const plan = buildPlan(missingCore, missingOpt, role)

    // Persist checkboxes per plan key
    const planKey = [role, ...missingCore.slice(0, 3)].join('|')
    const [checks, setChecks] = useState<Record<string, boolean>>(() => {
        try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
    })
    const [expanded, setExpanded] = useState<number | null>(null)

    useEffect(() => {
        localStorage.setItem(LS_KEY, JSON.stringify(checks))
    }, [checks])

    const toggle = (key: string) => setChecks(c => ({ ...c, [key]: !c[key] }))
    const isChecked = (i: number) => !!checks[`${planKey}|${i}`]

    const completedCount = plan.filter((_, i) => isChecked(i)).length
    const completionPct = Math.round((completedCount / plan.length) * 100)

    const priorityColor: Record<string, string> = {
        Critical: 'var(--red)',
        High: 'var(--orange)',
        Medium: 'var(--blue)',
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Improvement Plan</div>
                <div className="page-subtitle">
                    Personalized roadmap for <strong style={{ color: 'var(--cyan)' }}>{role}</strong>
                    {' '}based on your resume analysis • {plan.length} tasks
                </div>
            </div>

            {/* Progress bar */}
            <div className="card mb-16">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <div className="card-title" style={{ marginBottom: 0 }}>Overall Progress</div>
                    <span style={{ fontSize: 20, fontWeight: 800, color: completionPct >= 80 ? 'var(--green)' : 'var(--blue)', letterSpacing: -1 }}>{completionPct}%</span>
                </div>
                <div className="progress-track" style={{ height: 10 }}>
                    <div className="progress-fill progress-fill--green" style={{ width: `${completionPct}%`, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {completedCount} of {plan.length} tasks completed
                    {!analysis && <span style={{ color: 'var(--orange)', marginLeft: 8 }}>⚠ Upload a resume to personalise this plan</span>}
                </div>
            </div>

            {/* Plan items */}
            <div className="card">
                {plan.map((item, i) => {
                    const checked = isChecked(i)
                    const open = expanded === i

                    return (
                        <div
                            key={i}
                            style={{
                                borderBottom: i < plan.length - 1 ? '1px solid var(--border)' : 'none',
                                paddingBottom: 16, marginBottom: 16,
                            }}
                        >
                            {/* Row */}
                            <div
                                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
                                onClick={() => setExpanded(open ? null : i)}
                            >
                                {/* Checkbox */}
                                <div
                                    onClick={e => { e.stopPropagation(); toggle(`${planKey}|${i}`) }}
                                    style={{ flexShrink: 0, marginTop: 2, cursor: 'pointer' }}
                                >
                                    {checked
                                        ? <CheckCircle size={20} color="var(--green)" />
                                        : <Circle size={20} color="var(--text-muted)" />
                                    }
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.days}</span>
                                        <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, background: `${priorityColor[item.priority]}18`, color: priorityColor[item.priority], fontWeight: 600 }}>
                                            {item.priority}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                                            <Clock size={10} />{item.duration}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: 14, fontWeight: 600, color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                                        textDecoration: checked ? 'line-through' : 'none',
                                        opacity: checked ? 0.6 : 1,
                                    }}>
                                        {item.title}
                                    </div>
                                </div>

                                {/* Expand chevron */}
                                <div style={{ color: 'var(--text-muted)', fontSize: 16, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</div>
                            </div>

                            {/* Expanded panel */}
                            {open && (
                                <div style={{ marginLeft: 32, marginTop: 12 }}>
                                    {/* Sub-tasks */}
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                                            <BookOpen size={10} style={{ marginRight: 4 }} />Tasks
                                        </div>
                                        {item.subtasks.map((task, ti) => (
                                            <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
                                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{task}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Resources */}
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                                            <ExternalLink size={10} style={{ marginRight: 4 }} />Learning Resources
                                        </div>
                                        {item.resources.map((r, ri) => (
                                            <a
                                                key={ri}
                                                href={r.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                                                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                                                    textDecoration: 'none', transition: 'border-color 0.15s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                                            >
                                                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{r.title}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.time}</span>
                                                    <ExternalLink size={10} color="var(--blue)" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Reset button */}
            <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                        const cleared: Record<string, boolean> = {}
                        localStorage.setItem(LS_KEY, JSON.stringify(cleared))
                        setChecks(cleared)
                    }}
                >
                    Reset Progress
                </button>
            </div>
        </div>
    )
}
