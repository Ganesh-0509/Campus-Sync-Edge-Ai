import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Animated skill-graph network — the centrepiece of the auth panel */
function SkillGraph() {
    // Nodes: [cx, cy, label, color]
    const nodes = [
        [190, 120, 'Python', '#3b82f6'],
        [310, 80, 'ML Engineer', '#22d3ee'],
        [380, 200, 'React', '#a78bfa'],
        [320, 300, 'SQL', '#22c55e'],
        [190, 290, 'Docker', '#f59e0b'],
        [110, 200, 'Node.js', '#ef4444'],
        [190, 200, 'You', '#f1f5f9'],   // centre
    ]
    // Edges from centre (index 6) to each spoke
    const edges = [0, 1, 2, 3, 4, 5].map(i => [nodes[6], nodes[i]])

    return (
        <div className="network-canvas">
            <svg viewBox="0 0 480 380" style={{ height: 220 }}>
                {/* Edges */}
                {edges.map(([a, b], i) => (
                    <line
                        key={i}
                        className="network-edge"
                        x1={a[0] as number} y1={a[1] as number}
                        x2={b[0] as number} y2={b[1] as number}
                        stroke={b[3] as string}
                        strokeWidth="1.5"
                        strokeOpacity="0.45"
                    />
                ))}

                {/* Nodes */}
                {nodes.map(([cx, cy, label, color], i) => {
                    const isCenter = i === nodes.length - 1
                    return (
                        <g key={i}>
                            {/* Outer glow ring */}
                            <circle cx={cx as number} cy={cy as number} r={isCenter ? 28 : 18}
                                fill={`${color}15`} stroke={`${color}30`} strokeWidth="1" />
                            {/* Core circle */}
                            <circle
                                cx={cx as number} cy={cy as number}
                                r={isCenter ? 18 : 10}
                                fill={isCenter ? '#1a2035' : `${color}20`}
                                stroke={color as string}
                                strokeWidth={isCenter ? 2.5 : 1.5}
                                className="network-node"
                            />
                            {/* Label */}
                            <text
                                x={isCenter ? cx as number : (cx as number)}
                                y={isCenter ? (cy as number) + 5 : (cy as number) + (i < 3 ? -20 : 22)}
                                textAnchor="middle"
                                fontSize={isCenter ? 9 : 10}
                                fontWeight="600"
                                fill={color as string}
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                {label as string}
                            </text>
                        </g>
                    )
                })}

                {/* Scanning line */}
                <rect x="80" width="320" y="60" height="250" fill="none" clipPath="url(#clip)">
                </rect>
                <line x1="80" x2="400" y1="160" y2="160"
                    stroke="rgba(34,211,238,0.15)" strokeWidth="1"
                    style={{ animation: 'scanLine 3s ease-in-out infinite' }}
                />
            </svg>
        </div>
    )
}

function AuthPanel() {
    const CHIPS = [
        { label: 'Python', cls: 'blue' },
        { label: 'React', cls: 'cyan' },
        { label: 'ML Engineer', cls: 'purple' },
        { label: 'SQL', cls: 'green' },
        { label: 'Docker', cls: 'orange' },
        { label: 'Node.js', cls: 'blue' },
        { label: 'TensorFlow', cls: 'cyan' },
    ]

    return (
        <div className="auth-panel">
            <div className="auth-panel__brand">
                <div className="auth-panel__logo-icon">⚡</div>
                <div>
                    <div className="auth-panel__logo-name">CampusSync</div>
                    <div className="auth-panel__logo-sub">Edge AI</div>
                </div>
            </div>

            <SkillGraph />

            <div className="skill-chips">
                {CHIPS.map((c, i) => (
                    <span key={i} className={`skill-chip skill-chip--${c.cls}`}>{c.label}</span>
                ))}
            </div>

            <div className="auth-panel__tagline" style={{ marginTop: 24 }}>
                <h2>Your <span className="hl">Career GPS</span><br />powered by Edge AI</h2>
                <p>Measure skill readiness, close gaps, and reach placement-ready — all on device.</p>
            </div>

            <div className="auth-stats">
                <div className="auth-stat">
                    <div className="auth-stat__val"><span>82</span>%</div>
                    <div className="auth-stat__lbl">Model Accuracy</div>
                </div>
                <div className="auth-stat">
                    <div className="auth-stat__val"><span>2K</span>+</div>
                    <div className="auth-stat__lbl">Training Records</div>
                </div>
                <div className="auth-stat">
                    <div className="auth-stat__val"><span>6</span></div>
                    <div className="auth-stat__lbl">Roles Tracked</div>
                </div>
            </div>
        </div>
    )
}

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handle = async (e: FormEvent) => {
        e.preventDefault()
        if (!email || !password) { setError('Please fill all fields.'); return }
        setLoading(true); setError('')
        try {
            await login(email, password)
            navigate('/dashboard')
        } catch { setError('Login failed. Please try again.') }
        finally { setLoading(false) }
    }

    return (
        <div className="auth-shell">
            <AuthPanel />

            <div className="auth-form-panel">
                <div className="auth-form-box">
                    <h1>Welcome back 👋</h1>
                    <div className="auth-form-box__sub">Sign in to your Career Intelligence dashboard</div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handle}>
                        <div className="auth-field">
                            <label>Email address</label>
                            <input
                                type="email" placeholder="you@college.edu"
                                value={email} onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                type="password" placeholder="••••••••"
                                value={password} onChange={e => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? '⏳ Signing in...' : '→ Sign In'}
                        </button>
                    </form>

                    <div className="auth-divider">or</div>

                    <button className="google-btn" onClick={() => login('demo@campussync.ai', 'demo').then(() => navigate('/dashboard'))}>
                        <span style={{ fontSize: 16 }}>G</span> Continue with Google (Demo)
                    </button>

                    <div className="auth-switch">
                        Don't have an account? <Link to="/signup">Sign up free</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
