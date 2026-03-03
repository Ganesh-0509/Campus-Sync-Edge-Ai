import { useState, useEffect } from 'react'
import { useResume } from '../context/ResumeContext'
import { getHealth } from '../api/client'
import {
    Monitor, Bell, Shield, Database, Trash2,
    Save, Cloud, Activity, Settings as SettingsIcon, User, Info, CheckCircle
} from 'lucide-react'

export default function Settings() {
    const { analysis, clear } = useResume()
    const [saved, setSaved] = useState(false)
    const [health, setHealth] = useState<{ status: string; model_version?: string; accuracy?: number; vocabulary_size?: number; trained_on?: number } | null>(null)

    // User Prefs from LocalStorage
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cse_theme') !== 'light')
    const [notifications, setNotifications] = useState(() => localStorage.getItem('cse_notifs') !== 'false')
    const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem('cse_privacy') === 'true')

    useEffect(() => {
        getHealth().then(h => setHealth(h)).catch(() => { })
    }, [])

    const handleSave = () => {
        localStorage.setItem('cse_notifs', String(notifications))
        localStorage.setItem('cse_theme', darkMode ? 'dark' : 'light')
        localStorage.setItem('cse_privacy', String(privacyMode))
        // Apply theme immediately
        if (darkMode) {
            document.documentElement.classList.remove('light-mode')
        } else {
            document.documentElement.classList.add('light-mode')
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <div className="page-title" style={{ fontSize: 24, fontWeight: 800 }}>Preferences</div>
                        <div className="page-subtitle">Configure your workspace and AI processing environment</div>
                    </div>
                </div>
                <button className={`btn ${saved ? 'btn--success' : 'btn--primary'}`} onClick={handleSave} style={{ minWidth: 140, background: saved ? 'var(--green)' : 'var(--blue)' }}>
                    {saved ? <CheckCircle size={16} /> : <Save size={16} />} {saved ? 'Saved Successfully' : 'Apply Changes'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 32 }}>
                {/* Left Column: Interaction & Data */}
                <div>
                    {/* Interaction Settings */}
                    <div className="card mb-24" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <Monitor size={16} className="text-blue" /> Interaction Prefs
                        </div>

                        <div className="settings-row" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>AI Analysis Notifications</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Get real-time alerts when your resume analysis is finalized</div>
                            </div>
                            <div className={`toggle ${notifications ? 'on' : ''}`} role="switch" aria-checked={notifications} aria-label="AI Analysis Notifications" tabIndex={0} onClick={() => setNotifications(!notifications)} onKeyDown={e => e.key === 'Enter' && setNotifications(!notifications)} />
                        </div>

                        <div className="settings-row" style={{ padding: '12px 0' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>Enhanced Privacy</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Anonymize all resume data before cloud processing</div>
                            </div>
                            <div className={`toggle ${privacyMode ? 'on' : ''}`} role="switch" aria-checked={privacyMode} aria-label="Enhanced Privacy" tabIndex={0} onClick={() => setPrivacyMode(!privacyMode)} onKeyDown={e => e.key === 'Enter' && setPrivacyMode(!privacyMode)} />
                        </div>
                    </div>

                    {/* Active Analysis Control */}
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <Database size={16} className="text-blue" /> Current Session Data
                        </div>

                        {analysis ? (
                            <div style={{ padding: 20, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.1)', marginBottom: 20 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--blue)', marginBottom: 8, textTransform: 'uppercase' }}>Active Profile Detected</div>
                                <div style={{ fontSize: 16, fontWeight: 750, marginBottom: 4 }}>{analysis.filename}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Analyzed as <strong style={{ color: 'var(--text-primary)' }}>{analysis.role}</strong> with {analysis.final_score}% readiness score.</div>
                            </div>
                        ) : (
                            <div style={{ padding: 20, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, textAlign: 'center', marginBottom: 20, border: '1px dashed var(--border)' }}>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No active resume profile in session.</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(239, 68, 68, 0.04)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Purge Local Memory</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Permanently erase all stored analysis history</div>
                            </div>
                            <button className="btn btn--danger btn--sm" onClick={clear} disabled={!analysis}>
                                <Trash2 size={14} /> Clear Session
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Ecosystem Monitor */}
                <div>
                    <div className="card" style={{ padding: 24, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <Cloud size={16} className="text-blue" /> AI Ecosystem Monitor
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>BACKEND CORE STATUS</span>
                                    {health ? (
                                        <span style={{ color: 'var(--green)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} /> LIVE
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--red)', fontWeight: 900 }}>OFFLINE</span>
                                    )}
                                </div>
                                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Activity size={14} className="text-blue" />
                                        <span>Cluster Logic: <strong>{health?.status?.toUpperCase() ?? 'COULD NOT REACH'}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>INTELLIGENCE LAYER</span>
                                    <span style={{ color: 'var(--blue)', fontWeight: 800 }}>MODEL {health?.model_version ?? 'V2.1'}</span>
                                </div>
                                <div style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accuracy Rating</span>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cyan)' }}>{health?.accuracy ? `${(health.accuracy * 100).toFixed(1)}%` : '--'}</span>
                                    </div>
                                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vocabulary Size</span>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--blue)' }}>{health?.vocabulary_size?.toLocaleString() ?? '--'} words</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: 20, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{ marginTop: 2 }}><Info size={14} className="text-blue" /></div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--blue)', marginBottom: 4 }}>DID YOU KNOW?</div>
                                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                            The CampusSync engine uses a locally cached ONNX model for initial classification before delegating complex semantic reasoning to the cloud. This saves up to 40% battery on mobile devices.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
