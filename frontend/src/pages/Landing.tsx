import { Link } from 'react-router-dom'

const FEATURES = [
    { icon: '🧠', title: 'Skill Graph Engine', desc: 'Builds a personal skill dependency graph from your resume. Maps missing skills and their prerequisites.' },
    { icon: '📊', title: 'Readiness Score', desc: 'Deterministic weighted scoring across core coverage, projects, ATS quality and structure.' },
    { icon: '🤖', title: 'ML Role Prediction', desc: 'RandomForest model (82.1% accuracy) trained on 2,000 synthetic + real resumes predicts your best-fit role.' },
    { icon: '🎙️', title: 'Interview Analyzer', desc: 'Speak or type your answers. On-device concept matching scores technical depth and gives actionable feedback.' },
    { icon: '📈', title: 'Growth Tracking', desc: 'Every upload logs your score. Watch your readiness grow week-over-week with a real historical chart.' },
    { icon: '🔒', title: 'Privacy First', desc: 'Resume data stays in your browser session. No resume file is stored on external servers.' },
]

const STEPS = [
    { num: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX resume. The AI extracts skills, sections, and links in seconds.' },
    { num: '02', title: 'Get Readiness Score', desc: 'See your job readiness % for your target role with a breakdown of core vs optional skill coverage.' },
    { num: '03', title: 'Close Skill Gaps', desc: 'Get a ranked list of missing skills with learning paths showing what prerequisites you need first.' },
    { num: '04', title: 'Practice Interviews', desc: 'Answer real technical questions by voice. Get scored on concept coverage and targeted feedback.' },
]

const STATS = [
    { val: '2,000+', lbl: 'Training Records' },
    { val: '82.1%', lbl: 'Model Accuracy' },
    { val: '6', lbl: 'Roles Tracked' },
    { val: '30+', lbl: 'Interview Questions' },
]

export default function Landing() {
    return (
        <div style={{ background: 'var(--bg-app)', minHeight: '100vh', fontFamily: 'var(--font)', color: 'var(--text-primary)' }}>

            {/* ── NAV ─────────────────────────────────────────────────────── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
                display: 'flex', alignItems: 'center', padding: '0 40px', height: 62,
                background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#3b82f6,#22d3ee)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>CampusSync</div>
                        <div style={{ fontSize: 9, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>Edge AI</div>
                    </div>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <a href="#features" style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 12px' }}>Features</a>
                    <a href="#how" style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 12px' }}>How It Works</a>
                    <Link to="/login" style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>Sign In</Link>
                    <Link to="/signup" style={{ fontSize: 13, color: 'white', padding: '7px 16px', background: 'var(--blue)', borderRadius: 8, fontWeight: 600 }}>Get Started Free →</Link>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────────────────────────────── */}
            <section style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                padding: '100px 40px 80px', position: 'relative', overflow: 'hidden',
            }}>
                {/* Background orbs */}
                <div style={{ position: 'absolute', top: '15%', left: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

                {/* Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', marginBottom: 24, fontSize: 12, fontWeight: 600, color: 'var(--blue)', animation: 'fadeSlideIn 0.6s ease both' }}>
                    ✨ Now with Edge AI — Interview Analyzer Live
                </div>

                <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, maxWidth: 800, animation: 'fadeSlideIn 0.7s 0.1s ease both', opacity: 0, animationFillMode: 'forwards' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Measure.</span>{' '}
                    <span style={{ color: 'var(--blue)' }}>Improve.</span>{' '}
                    <span style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Achieve.</span>
                </h1>

                <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 540, lineHeight: 1.7, margin: '20px auto 36px', animation: 'fadeSlideIn 0.7s 0.2s ease both', opacity: 0, animationFillMode: 'forwards' }}>
                    AI-powered career readiness intelligence for engineering students.<br />Know exactly where you stand — and exactly what to fix.
                </p>

                <div style={{ display: 'flex', gap: 12, animation: 'fadeSlideIn 0.7s 0.3s ease both', opacity: 0, animationFillMode: 'forwards' }}>
                    <Link to="/signup" style={{ padding: '13px 28px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
                        🚀 Start Free — No Account Needed
                    </Link>
                    <a href="#how" style={{ padding: '13px 24px', background: 'transparent', borderRadius: 10, color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, border: '1px solid var(--border)', textDecoration: 'none' }}>
                        Watch How It Works ↓
                    </a>
                </div>

                {/* Floating metric cards */}
                <div style={{ display: 'flex', gap: 16, marginTop: 56, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeSlideIn 0.8s 0.4s ease both', opacity: 0, animationFillMode: 'forwards' }}>
                    {[
                        { label: 'Readiness Score', val: '74%', color: '#3b82f6', icon: '📊' },
                        { label: 'Skills Detected', val: '18', color: '#22d3ee', icon: '🧠' },
                        { label: 'Missing Skills', val: '5', color: '#f59e0b', icon: '🎯' },
                        { label: 'Interview Score', val: '68%', color: '#a78bfa', icon: '🎙️' },
                    ].map((m, i) => (
                        <div key={i} style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 14, padding: '16px 22px', textAlign: 'center',
                            minWidth: 130,
                            animation: `floatUp ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.4}s`,
                        }}>
                            <div style={{ fontSize: 22 }}>{m.icon}</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: m.color, letterSpacing: -1 }}>{m.val}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── STATS BAR ─────────────────────────────────────────────── */}
            <div style={{ background: 'rgba(59,130,246,0.05)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '28px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
                    {STATS.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -1 }}>
                                <span style={{ color: 'var(--cyan)' }}>{s.val}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>{s.lbl}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
            <section id="how" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>HOW IT WORKS</div>
                    <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>From resume to offer — <span style={{ color: 'var(--blue)' }}>in 4 steps</span></h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                    {STEPS.map((s, i) => (
                        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ fontSize: 48, fontWeight: 900, color: 'rgba(59,130,246,0.08)', position: 'absolute', top: 12, right: 16, lineHeight: 1 }}>{s.num}</div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 14, fontWeight: 800, color: 'var(--blue)' }}>{i + 1}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, position: 'relative' }}>{s.title}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, position: 'relative' }}>{s.desc}</div>
                            {i < STEPS.length - 1 && (
                                <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--blue)', opacity: 0.3, zIndex: 2 }}>→</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ──────────────────────────────────────────────── */}
            <section id="features" style={{ padding: '20px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>FEATURES</div>
                    <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>Not a resume scanner.<br /><span style={{ color: 'var(--cyan)' }}>A career intelligence system.</span></h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {FEATURES.map((f, i) => (
                        <div key={i} style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 14, padding: '24px',
                            transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                        }}
                            onMouseEnter={e => {
                                const el = e.currentTarget
                                el.style.transform = 'translateY(-4px)'
                                el.style.borderColor = 'rgba(59,130,246,0.4)'
                                el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget
                                el.style.transform = 'translateY(0)'
                                el.style.borderColor = 'var(--border)'
                                el.style.boxShadow = 'none'
                            }}
                        >
                            <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── AMD BADGE ─────────────────────────────────────────────── */}
            <div style={{ background: 'linear-gradient(135deg, #0a1628, #0d2040)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '36px 40px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>OPTIMIZED FOR</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
                    {['⚡ AMD Ryzen AI NPU', '🔷 ONNX Models', '🔒 On-Device Inference', '🎙️ Web Speech API', '🌐 No Cloud Required'].map((l, i) => (
                        <div key={i} style={{ padding: '8px 18px', borderRadius: 20, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>{l}</div>
                    ))}
                </div>
            </div>

            {/* ── CTA ────────────────────────────────────────────────────── */}
            <section style={{ padding: '80px 40px', textAlign: 'center' }}>
                <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
                    Ready to measure your readiness?
                </h2>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>
                    Upload your resume. Get your score in 10 seconds. No sign-up needed to try.
                </p>
                <Link to="/signup" style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 12px 40px rgba(59,130,246,0.35)', display: 'inline-block' }}>
                    🚀 Start for Free — It's Instant
                </Link>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⚡</span>
                    <span style={{ fontWeight: 700 }}>CampusSync Edge AI</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>— v4.1.0</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Built on FastAPI · RandomForest · Web Speech API · Supabase
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <Link to="/login" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sign In</Link>
                    <Link to="/signup" style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>Get Started</Link>
                </div>
            </footer>
        </div>
    )
}
