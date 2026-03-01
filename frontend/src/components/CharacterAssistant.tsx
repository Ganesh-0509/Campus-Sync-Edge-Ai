import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'

interface CharacterAssistantProps {
    state: 'idle' | 'typing' | 'loading' | 'error' | 'success'
    message?: string
}

export default function CharacterAssistant({ state, message }: CharacterAssistantProps) {
    const [blink, setBlink] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setBlink(true)
            setTimeout(() => setBlink(false), 200)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    const getMoodColor = () => {
        switch (state) {
            case 'error': return '#ef4444'
            case 'success': return '#22c55e'
            case 'loading': return '#3b82f6'
            default: return '#3b82f6'
        }
    }

    const moodColor = getMoodColor()

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            transition: 'all 0.3s ease'
        }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
                {/* Sparkles for success */}
                {state === 'success' && (
                    <div style={{ position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, pointerEvents: 'none' }}>
                        <Sparkles color="#eab308" size={24} style={{ position: 'absolute', top: 0, left: 0 }} />
                        <Sparkles color="#eab308" size={20} style={{ position: 'absolute', bottom: 0, right: 0 }} />
                    </div>
                )}

                {/* Character Body */}
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>
                    <defs>
                        <linearGradient id="charGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={moodColor} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={moodColor} stopOpacity="0.05" />
                        </linearGradient>
                    </defs>

                    {/* Head */}
                    <circle cx="50" cy="50" r="45" fill="url(#charGrad)" stroke={moodColor} strokeWidth="2" />

                    {/* Eyes */}
                    <g transform={state === 'typing' ? 'translate(2, 2)' : ''}>
                        {/* Left Eye */}
                        <ellipse cx="35" cy="45" rx="5" ry={blink ? 1 : 6} fill={moodColor} style={{ transition: 'ry 0.1s' }} />
                        {/* Right Eye */}
                        <ellipse cx="65" cy="45" rx="5" ry={blink ? 1 : 6} fill={moodColor} style={{ transition: 'ry 0.1s' }} />

                        {/* Brows - Sad for error */}
                        {state === 'error' && (
                            <g>
                                <path d="M28 35 Q 35 38 42 35" fill="none" stroke={moodColor} strokeWidth="2" strokeLinecap="round" />
                                <path d="M58 35 Q 65 38 72 35" fill="none" stroke={moodColor} strokeWidth="2" strokeLinecap="round" />
                            </g>
                        )}
                    </g>

                    {/* Mouth */}
                    {state === 'success' ? (
                        <path d="M35 65 Q 50 75 65 65" fill="none" stroke={moodColor} strokeWidth="3" strokeLinecap="round" />
                    ) : state === 'error' ? (
                        <path d="M35 70 Q 50 60 65 70" fill="none" stroke={moodColor} strokeWidth="3" strokeLinecap="round" />
                    ) : state === 'loading' ? (
                        <circle cx="50" cy="68" r="4" fill={moodColor} />
                    ) : (
                        <path d="M40 68 Q 50 70 60 68" fill="none" stroke={moodColor} strokeWidth="2" strokeLinecap="round" />
                    )}
                </svg>

                {/* Status Icon badge */}
                <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    background: 'var(--bg-app)', borderRadius: '50%', padding: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {state === 'error' && <AlertCircle color="#ef4444" size={18} />}
                    {state === 'success' && <CheckCircle2 color="#22c55e" size={18} />}
                </div>
            </div>

            {/* Speech Bubble */}
            <div style={{
                background: 'var(--bg-card)',
                border: `1px solid ${state === 'error' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '10px 16px',
                maxWidth: 240,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0, borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent', borderBottom: '6px solid var(--bg-card)'
                }} />
                <div style={{
                    fontSize: 13, fontWeight: 500, color: state === 'error' ? 'var(--red)' : 'var(--text-primary)',
                    lineHeight: 1.5
                }}>
                    {message || getDefaultMessage(state)}
                </div>
            </div>
        </div>
    )
}

function getDefaultMessage(state: string) {
    switch (state) {
        case 'idle': return "Welcome! Ready to sync your career path? ⚡"
        case 'typing': return "I'm watching! Keep going... ✍️"
        case 'loading': return "Verifying your credentials... 🔐"
        case 'success': return "Verified! Let's check your readiness score 🚀"
        case 'error': return "Hmm, something's off. Try again? 🧐"
        default: return "Hello there!"
    }
}
