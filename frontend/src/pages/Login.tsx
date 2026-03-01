import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type CharState = 'idle' | 'looking' | 'hiding' | 'happy' | 'error'

const TIPS: Record<CharState, string> = {
    idle: "Hi! Ready to pick up your placement journey? 👋",
    looking: "Looking good! Enter your email...",
    hiding: "Oops! I'm not peeking at your password! 🙈",
    happy: "Verified! Let's check your readiness score 🚀",
    error: "Hmm, something's off. Try again? 🧐",
}

/* ─── Pupil offsets per state ── */
const PUPIL_OFFSET: Record<CharState, [number, number]> = {
    idle: [0, 0],
    looking: [5, 0],
    hiding: [0, 2],
    happy: [0, -1],
    error: [0, 3],
}

/* ─── Arm rotations per state (applied from shoulder pivot) ─── */
const ARM_ROT: Record<CharState, number> = {
    idle: 0,
    looking: 5,
    hiding: 165,   // swings UP over face
    happy: -20,
    error: 15,
}

function AnimatedCharacter({ state }: { state: CharState }) {
    const [px, py] = PUPIL_OFFSET[state]
    const armDeg = ARM_ROT[state]
    const hiding = state === 'hiding'
    const happy = state === 'happy'
    const error = state === 'error'

    /* arm spring transition */
    const armTransition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)'
    const pupilTransition = 'all 0.25s ease'

    /* mouth: draw three shapes, fade between them */
    return (
        <svg
            viewBox="0 0 240 235"
            style={{ width: '100%', maxWidth: 210, display: 'block', margin: '0 auto', overflow: 'visible' }}
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="skinGrad" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#ffe4be" />
                    <stop offset="100%" stopColor="#f4b77a" />
                </radialGradient>
                <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <radialGradient id="eyeGrad" cx="30%" cy="30%">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
                </filter>
            </defs>

            {/* ── Floor shadow ── */}
            <ellipse cx="120" cy="228" rx="50" ry="7" fill="rgba(0,0,0,0.15)" />

            {/* ── BODY (shirt) ── needs to be before arms so arms render on top */}
            <rect x="82" y="162" width="76" height="58" rx="16" fill="url(#shirtGrad)" filter="url(#dropShadow)" />
            {/* Collar detail */}
            <polygon points="120,160 106,178 120,183 134,178" fill="white" opacity="0.9" />
            {/* AI badge */}
            <circle cx="120" cy="197" r="10" fill="rgba(255,255,255,0.12)" />
            <text x="120" y="201" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">AI</text>

            {/* ── LEFT ARM — pivot from TOP-RIGHT corner (= shoulder) ── */}
            <g style={{
                transformBox: 'fill-box' as any,
                transformOrigin: 'right top',
                transform: `rotate(${-armDeg}deg)`,
                transition: armTransition,
            }}>
                <rect x="52" y="162" width="28" height="78" rx="14" fill="url(#shirtGrad)" />
                <circle cx="66" cy="244" r="17" fill="url(#skinGrad)" />
                {/* Knuckles */}
                <circle cx="58" cy="242" r="4" fill="#e8a570" opacity="0.7" />
                <circle cx="66" cy="247" r="4" fill="#e8a570" opacity="0.7" />
                <circle cx="74" cy="242" r="4" fill="#e8a570" opacity="0.7" />
            </g>

            {/* ── RIGHT ARM — pivot from TOP-LEFT corner (= shoulder) ── */}
            <g style={{
                transformBox: 'fill-box' as any,
                transformOrigin: 'left top',
                transform: `rotate(${armDeg}deg)`,
                transition: armTransition,
            }}>
                <rect x="160" y="162" width="28" height="78" rx="14" fill="url(#shirtGrad)" />
                <circle cx="174" cy="244" r="17" fill="url(#skinGrad)" />
                <circle cx="166" cy="242" r="4" fill="#e8a570" opacity="0.7" />
                <circle cx="174" cy="247" r="4" fill="#e8a570" opacity="0.7" />
                <circle cx="182" cy="242" r="4" fill="#e8a570" opacity="0.7" />
            </g>

            {/* ── HEAD (on top) ── */}
            <ellipse cx="120" cy="85" rx="62" ry="66" fill="url(#skinGrad)" filter="url(#dropShadow)" />

            {/* Ear shadows */}
            <ellipse cx="58" cy="85" rx="10" ry="14" fill="#f4b77a" />
            <ellipse cx="182" cy="85" rx="10" ry="14" fill="#f4b77a" />
            <ellipse cx="58" cy="85" rx="6" ry="8" fill="#e8a570" opacity="0.6" />
            <ellipse cx="182" cy="85" rx="6" ry="8" fill="#e8a570" opacity="0.6" />

            {/* ── Hair ── */}
            <ellipse cx="120" cy="42" rx="52" ry="28" fill="#2d1810" />
            <ellipse cx="120" cy="32" rx="44" ry="18" fill="#3d2215" />
            {/* Side hair */}
            <ellipse cx="68" cy="58" rx="14" ry="18" fill="#2d1810" />
            <ellipse cx="172" cy="58" rx="14" ry="18" fill="#2d1810" />

            {/* ── Glasses Frame ── */}
            <rect x="84" y="72" width="26" height="22" rx="7" fill="none" stroke="#1a1a2e" strokeWidth="2.5" />
            <rect x="130" y="72" width="26" height="22" rx="7" fill="none" stroke="#1a1a2e" strokeWidth="2.5" />
            <line x1="110" y1="83" x2="130" y2="83" stroke="#1a1a2e" strokeWidth="2" />
            <line x1="84" y1="83" x2="72" y2="81" stroke="#1a1a2e" strokeWidth="1.8" />
            <line x1="156" y1="83" x2="168" y2="81" stroke="#1a1a2e" strokeWidth="1.8" />
            {/* Glass tint */}
            <rect x="85" y="73" width="24" height="20" rx="6" fill="rgba(59,130,246,0.1)" />
            <rect x="131" y="73" width="24" height="20" rx="6" fill="rgba(59,130,246,0.1)" />

            {/* ── Eyes ── */}
            {/* Left eye white */}
            <ellipse
                cx="97" cy="83"
                rx={happy ? 8 : 8}
                ry={hiding ? 0.5 : happy ? 4 : 8}
                fill="white"
                style={{ transition: 'ry 0.3s ease' }}
            />
            {/* Left pupil */}
            {!hiding && (
                <circle
                    cx={97 + px} cy={83 + py}
                    r={happy ? 4 : 5}
                    fill="url(#eyeGrad)"
                    style={{ transition: pupilTransition }}
                />
            )}
            {/* Left shine */}
            {!hiding && <circle cx={99 + px} cy={80 + py} r="1.8" fill="white" />}

            {/* Right eye white */}
            <ellipse
                cx="143" cy="83"
                rx={8}
                ry={hiding ? 0.5 : happy ? 4 : 8}
                fill="white"
                style={{ transition: 'ry 0.3s ease' }}
            />
            {/* Right pupil */}
            {!hiding && (
                <circle
                    cx={143 + px} cy={83 + py}
                    r={happy ? 4 : 5}
                    fill="url(#eyeGrad)"
                    style={{ transition: pupilTransition }}
                />
            )}
            {!hiding && <circle cx={145 + px} cy={80 + py} r="1.8" fill="white" />}

            {/* ── Eyebrows ── */}
            <path
                d={error ? 'M 86,67 Q 97,73 108,67' : happy ? 'M 87,65 Q 97,61 107,65' : 'M 87,67 Q 97,63 107,67'}
                stroke="#2d1810" strokeWidth="2.5" fill="none" strokeLinecap="round"
                style={{ transition: 'd 0.3s ease' }}
            />
            <path
                d={error ? 'M 132,67 Q 143,73 154,67' : happy ? 'M 133,65 Q 143,61 153,65' : 'M 133,67 Q 143,63 153,67'}
                stroke="#2d1810" strokeWidth="2.5" fill="none" strokeLinecap="round"
                style={{ transition: 'd 0.3s ease' }}
            />

            {/* ── Nose ── */}
            <path d="M 118,98 Q 113,110 118,112 Q 123,110 118,98" fill="none" stroke="#d4956a" strokeWidth="1.8" strokeLinecap="round" />

            {/* ── Mouths (one per state, toggle opacity) ── */}
            {/* Neutral */}
            <path d="M 103,120 Q 120,128 137,120" fill="none" stroke="#b06040" strokeWidth="2.8" strokeLinecap="round"
                style={{ opacity: (state === 'idle' || state === 'looking') ? 1 : 0, transition: 'opacity 0.3s' }} />
            {/* Hiding — small nervous */}
            <path d="M 108,120 Q 120,125 132,120" fill="none" stroke="#b06040" strokeWidth="2.8" strokeLinecap="round"
                style={{ opacity: hiding ? 1 : 0, transition: 'opacity 0.3s' }} />
            {/* Happy — big smile with teeth */}
            <path d="M 97,117 Q 120,140 143,117" fill="#b06040" stroke="#b06040" strokeWidth="2" strokeLinecap="round"
                style={{ opacity: happy ? 1 : 0, transition: 'opacity 0.3s' }} />
            <path d="M 98,118 Q 120,133 142,118" fill="white" stroke="none"
                style={{ opacity: happy ? 1 : 0, transition: 'opacity 0.3s' }} />
            {/* Error — frown */}
            <path d="M 103,124 Q 120,116 137,124" fill="none" stroke="#b06040" strokeWidth="2.8" strokeLinecap="round"
                style={{ opacity: error ? 1 : 0, transition: 'opacity 0.3s' }} />

            {/* Cheeks */}
            <ellipse cx="78" cy="103" rx="13" ry="8" fill="rgba(255,120,80,0.18)" />
            <ellipse cx="162" cy="103" rx="13" ry="8" fill="rgba(255,120,80,0.18)" />

            {/* ── Legs ── */}
            <rect x="98" y="218" width="18" height="14" rx="5" fill="#1e3a5f" />
            <rect x="124" y="218" width="18" height="14" rx="5" fill="#1e3a5f" />

            {/* ── Happy sparkles ── */}
            {happy && (
                <>
                    <text x="178" y="55" fontSize="16" style={{ animation: 'chipFloat 0.8s ease-in-out infinite' }}>✨</text>
                    <text x="48" y="60" fontSize="14" style={{ animation: 'chipFloat 1.1s 0.2s ease-in-out infinite' }}>⭐</text>
                    <text x="180" y="90" fontSize="11" style={{ animation: 'chipFloat 1.3s 0.4s ease-in-out infinite' }}>🎉</text>
                </>
            )}
        </svg>
    )
}

/* ──────────────────────────────────────────────────────────────
   Login Page — Single Card Layout
   Character is directly above the form (same card, connected)
────────────────────────────────────────────────────────────── */
export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [charState, setChar] = useState<CharState>('idle')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            setError('Please fill all fields.')
            setChar('error')
            return
        }
        setLoading(true)
        setError('')
        setChar('looking')

        try {
            await login(email, password)
            setChar('happy')
            // Wait for the sparkles and big smile before moving on!
            setTimeout(() => navigate('/dashboard'), 2200)
        } catch {
            setChar('error')
            setError('Invalid credentials. Try the Google demo button below.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-app)',
            padding: '24px 16px',
            fontFamily: 'var(--font)',
        }}>
            <div style={{
                width: '100%',
                maxWidth: 440,
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: '0 32px 96px rgba(0,0,0,0.5)',
                border: '1px solid var(--border)',
            }}>

                {/* ── TOP: Character section ─────────────────────────────── */}
                <div style={{
                    background: 'linear-gradient(160deg, #060d18 0%, #0a1628 50%, #0d2040 100%)',
                    padding: '28px 40px 20px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Glow orbs */}
                    <div style={{ position: 'absolute', top: -40, left: '15%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: -20, right: '10%', width: 150, height: 150, background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, position: 'relative', zIndex: 2 }}>
                        <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#3b82f6,#22d3ee)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>CampusSync</span>
                            <span style={{ fontSize: 9, color: 'var(--blue)', display: 'block', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1 }}>Edge AI</span>
                        </div>
                    </div>

                    {/* Character */}
                    <div style={{ position: 'relative', zIndex: 2, marginBottom: -25 }}>
                        <AnimatedCharacter state={charState} />
                    </div>

                    {/* Speech bubble — moved down slightly to overlap less */}
                    <div style={{
                        position: 'relative',
                        zIndex: 3,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 14,
                        padding: '10px 18px',
                        marginTop: 15,
                        backdropFilter: 'blur(12px)',
                        transition: 'all 0.35s ease',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}>
                        {/* Tail pointing up */}
                        <div style={{
                            position: 'absolute', top: -9, left: '50%', marginLeft: -9,
                            width: 0, height: 0,
                            borderLeft: '9px solid transparent',
                            borderRight: '9px solid transparent',
                            borderBottom: '9px solid rgba(255,255,255,0.07)',
                        }} />
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, minHeight: 20, transition: 'all 0.3s' }}>
                            {TIPS[charState]}
                        </p>
                    </div>
                </div>

                {/* ── BOTTOM: Form section ───────────────────────────────── */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '28px 36px 32px',
                }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>
                        Welcome back 👋
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22 }}>
                        Sign in to your Career Intelligence dashboard
                    </p>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: 8, padding: '10px 12px',
                            fontSize: 12, color: 'var(--red)', marginBottom: 14,
                        }}>{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label>Email address</label>
                            <input
                                type="email"
                                placeholder="you@college.edu"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onFocus={() => { if (charState !== 'happy') setChar('looking') }}
                                onBlur={() => { if (charState !== 'happy') setChar('idle') }}
                                autoComplete="email"
                            />
                        </div>
                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => { if (charState !== 'happy') setChar('hiding') }}
                                onBlur={() => { if (charState !== 'happy') setChar('idle') }}
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={loading}
                            style={{ marginTop: 6 }}
                        >
                            {loading ? '⏳ Signing in...' : '→ Sign In'}
                        </button>
                    </form>

                    <div className="auth-divider">or</div>

                    <button
                        className="google-btn"
                        onClick={async () => {
                            setChar('happy')
                            await login('demo@campussync.ai', 'demo')
                            setTimeout(() => navigate('/dashboard'), 1000)
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Continue with Google (Demo)
                    </button>

                    <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign up free</Link>
                    </div>
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                        <Link to="/" style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Back to homepage</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
