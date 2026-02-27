import { useState, useEffect } from 'react'
import { useResume } from '../context/ResumeContext'
import { getHealth } from '../api/client'

export default function Settings() {
    const { analysis, clear } = useResume()
    const [darkMode, setDarkMode] = useState(true)
    const [notifications, setNotifications] = useState(true)
    const [autoAnalyze, setAutoAnalyze] = useState(false)
    const [apiUrl, setApiUrl] = useState('http://localhost:8000')
    const [saved, setSaved] = useState(false)
    const [health, setHealth] = useState<{ status: string; model_version?: string; accuracy?: number; vocabulary_size?: number; trained_on?: number } | null>(null)

    // Fetch real model metadata from backend
    useEffect(() => {
        getHealth().then(h => setHealth(h)).catch(() => { })
    }, [])

    const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

    const modelDisplay = health
        ? `v${health.model_version ?? '?'} — ${health.vocabulary_size ?? '?'} vocab, trained on ${health.trained_on ?? '?'} samples`
        : 'Fetching from backend...'

    const accuracyDisplay = health?.accuracy != null
        ? `${(health.accuracy * 100).toFixed(1)}%`
        : 'N/A'

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Settings</div>
                <div className="page-subtitle">Manage your preferences and account</div>
            </div>

            {/* Appearance */}
            <div className="card mb-16">
                <div className="settings-title">Appearance</div>
                <div className="settings-row">
                    <div>
                        <div className="settings-row__label">Dark Mode</div>
                        <div className="settings-row__desc">Use dark theme across the dashboard</div>
                    </div>
                    <div className={`toggle ${darkMode ? 'on' : ''}`} onClick={() => setDarkMode(!darkMode)} />
                </div>
            </div>

            {/* Notifications */}
            <div className="card mb-16">
                <div className="settings-title">Notifications</div>
                <div className="settings-row">
                    <div>
                        <div className="settings-row__label">Analysis Alerts</div>
                        <div className="settings-row__desc">Get notified when analysis completes</div>
                    </div>
                    <div className={`toggle ${notifications ? 'on' : ''}`} onClick={() => setNotifications(!notifications)} />
                </div>
                <div className="settings-row">
                    <div>
                        <div className="settings-row__label">Auto Re-analyze</div>
                        <div className="settings-row__desc">Automatically re-analyze when backend reconnects</div>
                    </div>
                    <div className={`toggle ${autoAnalyze ? 'on' : ''}`} onClick={() => setAutoAnalyze(!autoAnalyze)} />
                </div>
            </div>

            {/* API + Real model metadata */}
            <div className="card mb-16">
                <div className="settings-title">API Configuration</div>
                <div style={{ marginBottom: 12 }}>
                    <label className="select-label">Backend URL</label>
                    <input className="input-field" value={apiUrl} onChange={e => setApiUrl(e.target.value)} />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label className="select-label">Model Version</label>
                    <input className="input-field" value={modelDisplay} readOnly style={{ opacity: 0.75 }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label className="select-label">Model Accuracy</label>
                    <input className="input-field" value={accuracyDisplay} readOnly style={{ opacity: 0.75 }} />
                </div>
                {health && (
                    <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, marginBottom: 14, fontSize: 12 }}>
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>● Backend Connected</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 12 }}>Status: {health.status}</span>
                    </div>
                )}
                <button className="btn btn--primary" onClick={save}>{saved ? '✓ Saved' : 'Save Settings'}</button>
            </div>

            {/* Data */}
            <div className="card">
                <div className="settings-title">Data Management</div>
                <div className="settings-row">
                    <div>
                        <div className="settings-row__label">Current Resume Analysis</div>
                        <div className="settings-row__desc">
                            {analysis ? `${analysis.filename} — Score: ${analysis.final_score}% — Role: ${analysis.role}` : 'No resume uploaded yet'}
                        </div>
                    </div>
                    <button className="btn btn--danger btn--sm" onClick={clear} disabled={!analysis}>
                        Clear Data
                    </button>
                </div>
            </div>
        </div>
    )
}
