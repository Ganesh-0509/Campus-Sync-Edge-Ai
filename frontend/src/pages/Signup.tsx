import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Different illustration for signup — growth/journey theme */
function GrowthIllustration() {
    // Bars representing score progression
    const bars = [
        { h: 40, label: 'Jan', color: '#3b82f6' },
        { h: 60, label: 'Feb', color: '#3b82f6' },
        { h: 55, label: 'Mar', color: '#22d3ee' },
        { h: 78, label: 'Apr', color: '#22d3ee' },
        { h: 70, label: 'May', color: '#a78bfa' },
        { h: 90, label: 'Jun', color: '#22c55e' },
    ]
    const W = 420, H = 200
    const barW = 40, gap = 18
    const total = bars.length * barW + (bars.length - 1) * gap
    const startX = (W - total) / 2

    return (
        <div className="network-canvas">
            <svg viewBox={`0 0 ${W} ${H}`} style={{ height: 180 }}>
                {/* Floor line */}
                <line x1={startX - 10} x2={startX + total + 10} y1={H - 30} y2={H - 30}
                    stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                {bars.map((b, i) => {
                    const x = startX + i * (barW + gap)
                    const y = H - 30 - b.h
                    return (
                        <g key={i}>
                            {/* Bar */}
                            <rect
                                x={x} y={y} width={barW} height={b.h}
                                rx="5"
                                fill={`${b.color}30`}
                                stroke={b.color}
                                strokeWidth="1.5"
                                style={{ animation: `floatUp ${2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}
                            />
                            {/* Value label */}
                            <text x={x + barW / 2} y={y - 6} textAnchor="middle"
                                fontSize="10" fontWeight="700" fill={b.color}>
                                {Math.round(b.h * 1.1)}%
                            </text>
                            {/* X label */}
                            <text x={x + barW / 2} y={H - 12} textAnchor="middle"
                                fontSize="9" fill="#4b5563">
                                {b.label}
                            </text>
                        </g>
                    )
                })}

                {/* Trend line over bars */}
                <polyline
                    points={bars.map((b, i) => {
                        const x = startX + i * (barW + gap) + barW / 2
                        const y = H - 30 - b.h
                        return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(34,211,238,0.5)"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    strokeLinecap="round"
                />

                {/* Star at top */}
                <text x={startX + 5 * (barW + gap) + barW / 2} y={H - 30 - 90 - 16}
                    textAnchor="middle" fontSize="18">🎯</text>
            </svg>
        </div>
    )
}

function AuthPanelSignup() {
    return (
        <div className="auth-panel">
            <div className="auth-panel__brand">
                <div className="auth-panel__logo-icon">⚡</div>
                <div>
                    <div className="auth-panel__logo-name">CampusSync</div>
                    <div className="auth-panel__logo-sub">Edge AI</div>
                </div>
            </div>

            <GrowthIllustration />

            <div className="skill-chips">
                {[
                    { label: '📊 Readiness Score', cls: 'blue' },
                    { label: '🎯 Role Matching', cls: 'cyan' },
                    { label: '📈 Skill Graphs', cls: 'purple' },
                    { label: '🤖 ML-Powered', cls: 'green' },
                    { label: '⚡ Edge AI', cls: 'orange' },
                ].map((c, i) => (
                    <span key={i} className={`skill-chip skill-chip--${c.cls}`}>{c.label}</span>
                ))}
            </div>

            <div className="auth-panel__tagline" style={{ marginTop: 24 }}>
                <h2>Start your <span className="hl">AI-powered</span><br />placement journey</h2>
                <p>Upload your resume. Get a job readiness score in seconds. Know exactly what to improve.</p>
            </div>

            <div className="auth-stats">
                <div className="auth-stat">
                    <div className="auth-stat__val"><span>15</span>min</div>
                    <div className="auth-stat__lbl">Daily Plans</div>
                </div>
                <div className="auth-stat">
                    <div className="auth-stat__val">100<span>%</span></div>
                    <div className="auth-stat__lbl">On Device</div>
                </div>
                <div className="auth-stat">
                    <div className="auth-stat__val"><span>0</span>₹</div>
                    <div className="auth-stat__lbl">Free Tier</div>
                </div>
            </div>
        </div>
    )
}

import CharacterAssistant from '../components/CharacterAssistant'

export default function Signup() {
    const { signup } = useAuth()
    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [college, setCollege] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [charState, setCharState] = useState<'idle' | 'typing' | 'loading' | 'error' | 'success'>('idle')

    const handle = async (e: FormEvent) => {
        e.preventDefault()
        if (!name || !email || !password) { setCharState('error'); setError('Please fill all required fields.'); return }
        if (password.length < 6) { setCharState('error'); setError('Password must be at least 6 characters.'); return }

        setLoading(true); setError(''); setCharState('loading')
        try {
            await signup(name, email, password)
            setCharState('success')
            setTimeout(() => navigate('/dashboard'), 1500)
        } catch {
            setCharState('error')
            setError('Signup failed. Please try again.')
        } finally { setLoading(false) }
    }

    const onTyping = () => { if (charState === 'idle' || charState === 'error') setCharState('typing') }

    return (
        <div className="auth-shell">
            <AuthPanelSignup />

            <div className="auth-form-panel">
                <div className="auth-form-box">
                    <CharacterAssistant state={charState} message={error && charState === 'error' ? error : undefined} />

                    <h1>Create account 🚀</h1>
                    <div className="auth-form-box__sub">Your AI career coach is ready. Let's get started.</div>

                    <form onSubmit={handle}>
                        <div className="auth-field">
                            <label>Full Name *</label>
                            <input
                                type="text" placeholder="Ganesh Kumar"
                                value={name} onChange={e => setName(e.target.value)}
                                autoComplete="name" onFocus={onTyping}
                            />
                        </div>
                        <div className="auth-field">
                            <label>College Email *</label>
                            <input
                                type="email" placeholder="you@college.edu"
                                value={email} onChange={e => setEmail(e.target.value)}
                                autoComplete="email" onFocus={onTyping}
                            />
                        </div>
                        <div className="auth-field">
                            <label>College Name</label>
                            <input
                                type="text" placeholder="Anna University"
                                value={college} onChange={e => setCollege(e.target.value)}
                                onFocus={onTyping}
                            />
                        </div>
                        <div className="auth-field">
                            <label>Password *</label>
                            <input
                                type="password" placeholder="Min 6 characters"
                                value={password} onChange={e => setPassword(e.target.value)}
                                autoComplete="new-password" onFocus={onTyping}
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? '⏳ Creating account...' : '→ Create Free Account'}
                        </button>
                    </form>

                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                        By signing up you agree to our Terms of Service.<br />
                        Your resume data never leaves your device. 🔒
                    </div>

                    <div className="auth-switch">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
