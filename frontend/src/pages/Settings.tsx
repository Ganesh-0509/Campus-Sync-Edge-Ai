import { useState } from 'react'
import { useResume } from '../context/ResumeContext'

export default function Settings() {
    const { analysis, clear } = useResume()
    const [darkMode, setDarkMode] = useState(true)
    const [notifications, setNotifications] = useState(true)
    const [autoAnalyze, setAutoAnalyze] = useState(false)
    const [apiUrl, setApiUrl] = useState('http://localhost:8000')
    const [saved, setSaved] = useState(false)

    const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

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

            {/* API */}
            <div className="card mb-16">
                <div className="settings-title">API Configuration</div>
                <div style={{ marginBottom: 12 }}>
                    <label className="select-label">Backend URL</label>
                    <input className="input-field" value={apiUrl} onChange={e => setApiUrl(e.target.value)} />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label className="select-label">Model Version</label>
                    <input className="input-field" value="v2.0 (RandomForest — 82.1% accuracy)" readOnly style={{ opacity: 0.7 }} />
                </div>
                <button className="btn btn--primary" onClick={save}>
                    {saved ? '✓ Saved' : 'Save Settings'}
                </button>
            </div>

            {/* Data */}
            <div className="card">
                <div className="settings-title">Data Management</div>
                <div className="settings-row">
                    <div>
                        <div className="settings-row__label">Current Resume Analysis</div>
                        <div className="settings-row__desc">
                            {analysis ? `${analysis.filename} — Score: ${analysis.final_score}%` : 'No resume uploaded yet'}
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
