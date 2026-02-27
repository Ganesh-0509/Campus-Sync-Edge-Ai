import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ─────────────────────────────────────────────────────────────
   Character states (like Visme interactive forms)
   idle      → pupils centred, neutral smile
   looking   → pupils shift right toward input, slight smile
   hiding    → arms sweep up over eyes (password field)
   happy     → big smile, sparkle pupils, antenna spins
   error     → frown, pupils droop downward
───────────────────────────────────────────────────────────── */
type CharState = 'idle' | 'looking' | 'hiding' | 'happy' | 'error'

const TIPS: Record<CharState, string> = {
    idle: "Hey there! Let's pick up where you left off 👋",
    looking: "Looking good! Enter your email to continue...",
    hiding: "I promise I'm not looking at your password! 🙈",
    happy: "Verified! Let's check your readiness score 🚀",
    error: "Hmm, something's off. Want to try again? 🤔",
}

/* ─── Mouth paths ─── */
const MOUTH = {
    idle: 'M 84,105 Q 100,113 116,105',
    looking: 'M 84,105 Q 100,116 116,105',
    hiding: 'M 88,108 Q 100,114 112,108',
    happy: 'M 78,102 Q 100,124 122,102',
    error: 'M 84,112 Q 100,104 116,112',
}

/* ─── Pupil offsets ─── */
const PUPIL: Record<CharState, [number, number]> = {
    idle: [0, 0],
    looking: [4, 0],
    hiding: [0, 2],
    happy: [0, -1],
    error: [0, 3],
}

function AnimatedCharacter({ state }: { state: CharState }) {
    const hiding = state === 'hiding'
    const happy = state === 'happy'
    const [pX, pY] = PUPIL[state]

    /* pupil size shrinks to a "squint" when happy */
    const pupilR = happy ? 2.5 : 4.5

    /* eye vertical scale for squinting */
    const eyeScale = happy ? 'scaleY(0.42)' : 'scaleY(1)'

    return (
        <svg
            viewBox="0 0 200 320"
            style={{ width: '100%', maxWidth: 200, height: 'auto', display: 'block', margin: '0 auto' }}
            aria-label="Animated mascot"
        >
            <defs>
                {/* Skin gradient */}
                <radialGradient id="skin" cx="45%" cy="35%">
                    <stop offset="0%" stopColor="#ffe0bc" />
                    <stop offset="100%" stopColor="#f9c88a" />
                </radialGradient>
                {/* Body gradient */}
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                {/* Arm gradient */}
                <linearGradient id="armGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                {/* Hair gradient */}
                <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d1b00" />
                    <stop offset="100%" stopColor="#4a2f00" />
                </linearGradient>
                {/* Glasses lens */}
                <filter id="glow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* ── Shadow ── */}
            <ellipse cx="100" cy="318" rx="38" ry="7" fill="rgba(0,0,0,0.18)" />

            {/* ── Body / Blazer ── */}
            <rect x="62" y="195" width="76" height="85" rx="14" fill="url(#bodyGrad)" />
            {/* Collar / shirt */}
            <polygon points="100,195 86,215 100,220 114,215" fill="white" opacity="0.9" />
            {/* Blazer lapels */}
            <polygon points="62,195 62,245 84,215" fill="#1e40af" opacity="0.5" />
            <polygon points="138,195 138,245 116,215" fill="#1e40af" opacity="0.5" />
            {/* Logo badge */}
            <circle cx="100" cy="240" r="10" fill="rgba(255,255,255,0.15)" />
            <text x="100" y="244" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">AI</text>

            {/* ── Left arm ── */}
            <g
                style={{
                    transformOrigin: '68px 200px',
                    transform: hiding ? 'rotate(-100deg)' : 'rotate(0deg)',
                    transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                <rect x="42" y="195" width="26" height="68" rx="13" fill="url(#armGrad)" />
                {/* Hand */}
                <circle cx="55" cy="267" r="13" fill="url(#skin)" />
            </g>

            {/* ── Right arm ── */}
            <g
                style={{
                    transformOrigin: '132px 200px',
                    transform: hiding ? 'rotate(100deg)' : 'rotate(0deg)',
                    transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                <rect x="132" y="195" width="26" height="68" rx="13" fill="url(#armGrad)" />
                {/* Hand */}
                <circle cx="145" cy="267" r="13" fill="url(#skin)" />
            </g>

            {/* ── Neck ── */}
            <rect x="88" y="180" width="24" height="22" rx="6" fill="url(#skin)" />

            {/* ── Head ── */}
            <ellipse cx="100" cy="130" rx="52" ry="55" fill="url(#skin)" />

            {/* ── Ears ── */}
            <ellipse cx="49" cy="133" rx="9" ry="12" fill="#f0b060" />
            <ellipse cx="151" cy="133" rx="9" ry="12" fill="#f0b060" />
            {/* Ear shadow */}
            <ellipse cx="49" cy="133" rx="5" ry="7" fill="#e8a050" />
            <ellipse cx="151" cy="133" rx="5" ry="7" fill="#e8a050" />

            {/* ── Hair ── */}
            <path d="M 52,110 Q 60,62 100,58 Q 140,62 148,110 Q 140,78 100,76 Q 60,78 52,110Z" fill="url(#hairGrad)" />
            {/* Hair fringe */}
            <path d="M 64,90 Q 100,72 136,90 Q 118,82 100,80 Q 82,82 64,90Z" fill="#1a0e00" />
            {/* Side hair */}
            <path d="M 52,110 Q 50,95 56,85 Q 58,95 60,108Z" fill="url(#hairGrad)" />
            <path d="M 148,110 Q 150,95 144,85 Q 142,95 140,108Z" fill="url(#hairGrad)" />

            {/* ── Glasses frame ── */}
            <rect x="72" y="112" width="20" height="17" rx="5" fill="none" stroke="#333" strokeWidth="2.2" />
            <rect x="108" y="112" width="20" height="17" rx="5" fill="none" stroke="#333" strokeWidth="2.2" />
            {/* Bridge */}
            <line x1="92" y1="120" x2="108" y2="120" stroke="#333" strokeWidth="2" />
            {/* Temple pieces */}
            <line x1="72" y1="120" x2="58" y2="118" stroke="#333" strokeWidth="1.8" />
            <line x1="128" y1="120" x2="142" y2="118" stroke="#333" strokeWidth="1.8" />
            {/* Glass tint */}
            <rect x="73" y="113" width="18" height="15" rx="4" fill="rgba(59,130,246,0.08)" />
            <rect x="109" y="113" width="18" height="15" rx="4" fill="rgba(59,130,246,0.08)" />

            {/* ── Eyes ── (behind glasses) */}
            {/* Left eye */}
            <g style={{ transformOrigin: '82px 121px', transform: eyeScale, transition: 'transform 0.3s ease' }}>
                <circle cx="82" cy="121" r="6.5" fill="white" />
                {/* Pupil */}
                <circle
                    cx={82 + pX}
                    cy={121 + pY}
                    r={pupilR}
                    fill="#1a1a2e"
                    style={{ transition: 'cx 0.25s ease, cy 0.25s ease, r 0.2s ease' }}
                />
                {/* Shine */}
                {!hiding && <circle cx={83 + pX} cy={119 + pY} r="1.6" fill="white" />}
            </g>

            {/* Right eye */}
            <g style={{ transformOrigin: '118px 121px', transform: eyeScale, transition: 'transform 0.3s ease' }}>
                <circle cx="118" cy="121" r="6.5" fill="white" />
                <circle
                    cx={118 + pX}
                    cy={121 + pY}
                    r={pupilR}
                    fill="#1a1a2e"
                    style={{ transition: 'cx 0.25s ease, cy 0.25s ease, r 0.2s ease' }}
                />
                {!hiding && <circle cx={119 + pX} cy={119 + pY} r="1.6" fill="white" />}
            </g>

            {/* ── Eyebrows ── */}
            <path
                d={state === 'error' ? 'M 74,107 Q 82,111 90,108' : state === 'happy' ? 'M 74,106 Q 82,102 90,105' : 'M 74,107 Q 82,104 90,107'}
                stroke="#4a2f00" strokeWidth="2.2" fill="none" strokeLinecap="round"
                style={{ transition: 'd 0.3s ease' }}
            />
            <path
                d={state === 'error' ? 'M 110,108 Q 118,111 126,107' : state === 'happy' ? 'M 110,105 Q 118,102 126,106' : 'M 110,107 Q 118,104 126,107'}
                stroke="#4a2f00" strokeWidth="2.2" fill="none" strokeLinecap="round"
                style={{ transition: 'd 0.3s ease' }}
            />

            {/* ── Nose ── */}
            <path d="M 100,130 Q 95,142 100,144 Q 105,142 100,130" fill="none" stroke="#e0956a" strokeWidth="1.5" strokeLinecap="round" />

            {/* ── Mouth ── */}
            <path
                d={MOUTH[state]}
                fill="none"
                stroke="#c0724a"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ transition: 'd 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
            />

            {/* ── Happy sparkles ── */}
            {happy && (
                <>
                    <text x="152" y="95" fontSize="14" style={{ animation: 'chipFloat 1s ease-in-out infinite' }}>✨</text>
                    <text x="36" y="100" fontSize="12" style={{ animation: 'chipFloat 1.2s 0.2s ease-in-out infinite' }}>⭐</text>
                    <text x="155" y="125" fontSize="10" style={{ animation: 'chipFloat 1.4s 0.4s ease-in-out infinite' }}>🎉</text>
                </>
            )}

            {/* ── Blush (always show) ── */}
            <ellipse cx="68" cy="140" rx="10" ry="6" fill="rgba(255,100,80,0.15)" />
            <ellipse cx="132" cy="140" rx="10" ry="6" fill="rgba(255,100,80,0.15)" />

            {/* ── Legs ── */}
            <rect x="80" y="278" width="16" height="35" rx="8" fill="#1e3a5f" />
            <rect x="104" y="278" width="16" height="35" rx="8" fill="#1e3a5f" />
            {/* Shoes */}
            <ellipse cx="88" cy="313" rx="14" ry="7" fill="#111" />
            <ellipse cx="112" cy="313" rx="14" ry="7" fill="#111" />
        </svg>
    )
}

/* ─────────────────────────────────────────────────────────────
   Login Page
───────────────────────────────────────────────────────────── */
export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [charState, setChar] = useState<CharState>('idle')

    const handle = async (e: FormEvent) => {
        e.preventDefault()
        if (!email || !password) { setError('Please fill all fields.'); setChar('error'); return }
        setLoading(true); setError(''); setChar('looking')
        try {
            await login(email, password)
            setChar('happy')
            setTimeout(() => navigate('/dashboard'), 900)
        } catch {
            setError('Login failed. Check your credentials.')
            setChar('error')
        } finally { setLoading(false) }
    }

    return (
        <div className="auth-shell">

            {/* ── LEFT: Animated Character Panel ── */}
            <div className="auth-panel" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className="auth-panel__brand">
                    <div className="auth-panel__logo-icon">⚡</div>
                    <div>
                        <div className="auth-panel__logo-name">CampusSync</div>
                        <div className="auth-panel__logo-sub">Edge AI</div>
                    </div>
                </div>

                {/* Character */}
                <div style={{ width: '100%', maxWidth: 240, position: 'relative', zIndex: 2 }}>
                    <AnimatedCharacter state={charState} />
                </div>

                {/* Speech Bubble */}
                <div style={{
                    position: 'relative', zIndex: 2,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 16, padding: '14px 20px',
                    maxWidth: 280, textAlign: 'center', marginTop: 8,
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.4s ease',
                }}>
                    {/* Bubble tail */}
                    <div style={{
                        position: 'absolute', top: -10, left: '50%', marginLeft: -10,
                        width: 0, height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderBottom: '10px solid rgba(255,255,255,0.07)',
                    }} />
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {TIPS[charState]}
                    </p>
                </div>

                {/* Stats */}
                <div className="auth-stats" style={{ marginTop: 28 }}>
                    {[
                        { val: '82%', lbl: 'Model Accuracy' },
                        { val: '6', lbl: 'Roles Tracked' },
                        { val: '2K+', lbl: 'Records' },
                    ].map((s, i) => (
                        <div key={i} className="auth-stat">
                            <div className="auth-stat__val"><span>{s.val}</span></div>
                            <div className="auth-stat__lbl">{s.lbl}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── RIGHT: Form ── */}
            <div className="auth-form-panel">
                <div className="auth-form-box">
                    <h1>Welcome back 👋</h1>
                    <div className="auth-form-box__sub">Sign in to your Career Intelligence dashboard</div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handle}>
                        <div className="auth-field">
                            <label>Email address</label>
                            <input
                                id="login-email"
                                type="email"
                                placeholder="you@college.edu"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onFocus={() => setChar('looking')}
                                onBlur={() => setChar('idle')}
                                autoComplete="email"
                            />
                        </div>
                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                id="login-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => setChar('hiding')}
                                onBlur={() => setChar('idle')}
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? '⏳ Signing in...' : '→ Sign In'}
                        </button>
                    </form>

                    <div className="auth-divider">or</div>

                    <button
                        className="google-btn"
                        onClick={async () => {
                            setChar('happy')
                            await login('demo@campussync.ai', 'demo')
                            setTimeout(() => navigate('/dashboard'), 800)
                        }}
                    >
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#4285F4' }}>G</span>
                        Continue with Google (Demo)
                    </button>

                    <div className="auth-switch">
                        Don't have an account? <Link to="/signup">Sign up free</Link>
                    </div>

                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                        <Link to="/" style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Back to homepage</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
