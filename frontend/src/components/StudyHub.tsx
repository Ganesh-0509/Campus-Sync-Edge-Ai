import { useState, useEffect, useRef } from 'react'
import { X, BookOpen, CheckCircle2, ChevronRight, BrainCircuit, Lightbulb, Clock, MessageSquare, Send, Sparkles, Pin, Sun, Moon } from 'lucide-react'
import { getStudyNotes, getStudyQuiz, studyChat, submitContribution, type StudyNotesResult, type QuizResult } from '../api/client'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'

interface StudyHubProps {
    skill: string
    onClose: () => void
    onVerified: (skill: string) => void
}

type Tab = 'notes' | 'quiz' | 'ask'

export default function StudyHub({ skill, onClose, onVerified }: StudyHubProps) {
    const { masteredSkills } = useResume()
    const { user } = useAuth()
    const [tab, setTab] = useState<Tab>('notes')
    const [notes, setNotes] = useState<StudyNotesResult | null>(null)
    const [quiz, setQuiz] = useState<QuizResult | null>(null)
    const [loading, setLoading] = useState(true)

    // Quiz state
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<number[]>([])
    const [quizFinished, setQuizFinished] = useState(false)
    const [score, setScore] = useState(0)

    // Chat state
    const [query, setQuery] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Saved state
    const [isPinned, setIsPinned] = useState(false)
    // Theme & Notes state
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [personalNotes, setPersonalNotes] = useState(() => localStorage.getItem(`notes_${skill}`) || '')

    useEffect(() => {
        localStorage.setItem(`notes_${skill}`, personalNotes)
    }, [personalNotes, skill])

    useEffect(() => {
        setLoading(true)
        // Check if already pinned
        const pinned = JSON.parse(localStorage.getItem('pinned_notes') || '[]')
        setIsPinned(pinned.includes(skill))

        Promise.all([
            getStudyNotes(skill, masteredSkills),
            getStudyQuiz(skill)
        ]).then(([n, q]) => {
            setNotes(n)
            setQuiz(q)
        }).catch(err => {
            console.error(err)
        }).finally(() => setLoading(false))
    }, [skill, masteredSkills])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const togglePin = () => {
        const pinned = JSON.parse(localStorage.getItem('pinned_notes') || '[]')
        let next: string[]
        if (isPinned) {
            next = pinned.filter((s: string) => s !== skill)
        } else {
            next = [...pinned, skill]
        }
        localStorage.setItem('pinned_notes', JSON.stringify(next))
        setIsPinned(!isPinned)
    }

    const handleChat = async () => {
        if (!query.trim()) return
        const newMsg = { role: 'user' as const, content: query }
        const history = [...messages, newMsg]
        setMessages(history)
        setQuery('')
        setChatLoading(true)

        try {
            // Pass masteredSkills for better AI context
            const response = await studyChat(skill, query, history, masteredSkills)
            setMessages(prev => [...prev, { role: 'assistant', content: response }])
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI Tutor. Check your connection or API key." }])
        } finally {
            setChatLoading(false)
        }
    }

    const handleAnswer = (idx: number) => {
        const newAns = [...answers]
        newAns[currentQ] = idx
        setAnswers(newAns)

        if (quiz && currentQ < quiz.questions.length - 1) {
            setTimeout(() => setCurrentQ(v => v + 1), 600)
        } else if (quiz) {
            const correct = newAns.filter((a, i) => a === quiz.questions[i].correct_index).length
            setScore(correct)
            setQuizFinished(true)
            if (correct === quiz.questions.length) {
                onVerified(skill)
            }
        }
    }

    const [suggested, setSuggested] = useState(false)
    const handleSuggest = async () => {
        if (!personalNotes.trim()) return
        try {
            await submitContribution(skill, user?.name || 'Anonymous', { suggested_notes: personalNotes })
            setSuggested(true)
            setTimeout(() => setSuggested(false), 3000)
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return (
        <div className="study-modal">
            <div className="study-content study-content--loading">
                <div className="spinner study-spinner"></div>
                <h2>Gathering Learning Materials...</h2>
                <p>Personalizing notes for {skill} based on your career goal.</p>
            </div>
        </div>
    )

    return (
        <div className={`study-modal ${theme}-hub`}>
            <div className="study-workspace">
                {/* ── Focus Sidebar ── */}
                <aside className="workspace-sidebar">
                    <div className="sidebar-brand">
                        <Sparkles size={20} className="glow-icon" />
                        <span>Focus Mode</span>
                        <button
                            className="theme-toggle-btn"
                            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>

                    <div className="sidebar-mastery-card">
                        <p>Mastery Progress</p>
                        <div className="progress-track" style={{ height: 6, margin: '8px 0' }}>
                            <div className="progress-fill" style={{ width: `${quizFinished ? score === (quiz?.questions?.length || 0) ? '100%' : '50%' : '15%'}` }} />
                        </div>
                        <small>{isPinned ? 'Pinned for Review' : 'Learning Phase'}</small>
                    </div>

                    <div className="workspace-nav-group">
                        <h6>Main Navigation</h6>
                        <button
                            className={`ws-nav-item ${tab === 'notes' ? 'active' : ''}`}
                            onClick={() => setTab('notes')}
                        >
                            <BookOpen size={18} />
                            <span>Course Guide</span>
                        </button>
                        <button
                            className={`ws-nav-item ${tab === 'ask' ? 'active' : ''}`}
                            onClick={() => setTab('ask')}
                        >
                            <MessageSquare size={18} />
                            <span>AI Assistant</span>
                        </button>
                        <button
                            className={`ws-nav-item ${tab === 'quiz' ? 'active' : ''}`}
                            onClick={() => setTab('quiz')}
                        >
                            <CheckCircle2 size={18} />
                            <span>Knowledge Check</span>
                        </button>
                    </div>

                    <div className="workspace-nav-group">
                        <h6>Personal Scratchpad</h6>
                        <textarea
                            className="focus-scratchpad"
                            placeholder="Type your notes here... (saved automatically)"
                            value={personalNotes}
                            onChange={(e) => setPersonalNotes(e.target.value)}
                        />
                        <button
                            className="btn btn--outline btn--sm"
                            style={{ marginTop: 8, width: '100%' }}
                            onClick={handleSuggest}
                            disabled={!personalNotes.trim() || suggested}
                        >
                            {suggested ? <><CheckCircle2 size={14} /> Submitted</> : 'Suggest to Course'}
                        </button>
                    </div>

                    {notes?.sub_roadmap && (
                        <div className="workspace-nav-group">
                            <h6>Mastery Curriculum</h6>
                            {notes.sub_roadmap.map((step, idx) => (
                                <div key={idx} className="curriculum-item">
                                    <div className="item-dot" />
                                    <span>{step.title}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="sidebar-footer">
                        <button
                            className={`btn-pin ${isPinned ? 'pinned' : ''}`}
                            onClick={togglePin}
                        >
                            <Pin size={16} /> {isPinned ? 'Saved to Hub' : 'Pin to Study Hub'}
                        </button>
                    </div>
                </aside>

                {/* ── Main Workspace Body ── */}
                <main className="workspace-body">
                    <header className="workspace-header">
                        <div className="header-skill">
                            <div className="skill-avatar">{skill[0]}</div>
                            <div>
                                <h1>{skill}</h1>
                                <span>Mastery Course • Level {skill.toLowerCase() === 'dsa' ? 'Pro' : 'Core'}</span>
                            </div>
                        </div>
                        <button className="btn-close-ws" onClick={onClose}><X size={24} /></button>
                    </header>

                    <div className="workspace-content">
                        {tab === 'notes' && notes && (
                            <div className="workspace-pane fade-in">
                                <div className="notes-hero">
                                    <p>{notes.quick_summary}</p>
                                    <div className="time-est"><Clock size={16} />{notes.estimated_study_time} est. focus time</div>
                                </div>

                                {notes.sub_roadmap && notes.sub_roadmap.length > 0 && (
                                    <div className="roadmap-path">
                                        <div className="path-header">
                                            <Sparkles size={16} /> Hierarchical Mastery Path
                                        </div>
                                        <div className="path-items">
                                            {notes.sub_roadmap?.map((step: any, idx: number) => (
                                                <div key={idx} className="path-node">
                                                    <div className="node-marker">{idx + 1}</div>
                                                    <div className="node-info">
                                                        <div className="node-title">{step.title}</div>
                                                        <div className="node-meta">{step.duration} focus</div>
                                                    </div>
                                                    {notes.sub_roadmap && idx < notes.sub_roadmap.length - 1 && <div className="node-line" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {notes.detailed_content && notes.detailed_content.length > 0 ? (
                                    <div className="concept-sections">
                                        {notes.detailed_content.map((c, i) => (
                                            <div key={i} className="focus-card detailed-card">
                                                <div className="card-num">{i + 1}</div>
                                                <h3>{c.subheading}</h3>
                                                <div className="content-prose">
                                                    <p style={{ lineHeight: 1.6, marginBottom: 12 }}>{c.explanation}</p>

                                                    {c.algorithm && (
                                                        <div className="algo-block" style={{ marginBottom: 16 }}>
                                                            <strong style={{ display: 'block', color: 'var(--cyan)', marginBottom: 4 }}>Algorithm / Steps:</strong>
                                                            <p style={{ whiteSpace: 'pre-line', fontSize: 13, background: 'rgba(34, 211, 238, 0.05)', padding: 12, borderRadius: 8, borderLeft: '2px solid var(--cyan)' }}>{c.algorithm}</p>
                                                        </div>
                                                    )}

                                                    {c.example && (
                                                        <div className="example-block">
                                                            <div className="example-label">Code Output / Example</div>
                                                            <pre>{c.example}</pre>
                                                        </div>
                                                    )}

                                                    {c.complexity && (
                                                        <div style={{ marginTop: 16, display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                                                            <strong style={{ color: 'var(--orange)' }}>Complexity:</strong> <span>{c.complexity}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : notes.key_concepts && notes.key_concepts.length > 0 ? (
                                    <div className="concept-sections">
                                        {notes.key_concepts.map((c, i) => (
                                            <div key={i} className="focus-card">
                                                <div className="card-num">{i + 1}</div>
                                                <h3>{c.title}</h3>
                                                <p>{c.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="pro-zone">
                                    <div className="zone-icon"><Lightbulb size={24} /></div>
                                    <div className="zone-text">
                                        <h4>Industry Insight</h4>
                                        <p>{notes.pro_tip}</p>
                                    </div>
                                </div>

                                <div className="ws-actions">
                                    <button className="btn btn--primary" onClick={() => setTab('quiz')}>
                                        I'm ready for a Challenge <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {tab === 'ask' && (
                            <div className="workspace-pane chat-pane fade-in">
                                <div className="chat-history">
                                    {messages.length === 0 && (
                                        <div className="chat-empty">
                                            <BrainCircuit size={48} className="empty-icon" />
                                            <h3>Ask anything about {skill}</h3>
                                            <p>I can explain concepts, give code examples, or help you with specific doubts.</p>
                                        </div>
                                    )}
                                    {messages.map((m, i) => (
                                        <div key={i} className={`msg msg--${m.role}`}>
                                            <div className="msg-content">{m.content}</div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="msg msg--assistant">
                                            <div className="msg-content loading-dots">Thinking...</div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="chat-input-row">
                                    <input
                                        type="text"
                                        placeholder="Ask a question..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                                    />
                                    <button className="btn-send" onClick={handleChat} disabled={chatLoading}><Send size={18} /></button>
                                </div>
                            </div>
                        )}

                        {tab === 'quiz' && quiz && (
                            <div className="workspace-pane fade-in">
                                {!quizFinished ? (
                                    <div className="ws-quiz-box">
                                        <div className="quiz-progress-bar">
                                            <div
                                                className="q-fill"
                                                style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
                                            />
                                        </div>
                                        <div className="q-count">QUESTION {currentQ + 1} OF {quiz.questions.length}</div>
                                        <h2 className="q-text">{quiz.questions[currentQ].question}</h2>

                                        <div className="q-options">
                                            {quiz.questions[currentQ].options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    className={`q-opt ${answers[currentQ] === i ? 'selected' : ''}`}
                                                    onClick={() => handleAnswer(i)}
                                                >
                                                    <span className="q-letter">{String.fromCharCode(65 + i)}</span>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="ws-result-box">
                                        <div className={`result-score ${score === quiz.questions.length ? 'pass' : 'fail'}`}>
                                            {score}/{quiz.questions.length}
                                        </div>
                                        <h2>{score === quiz.questions.length ? 'Mastery Verified!' : 'Needs Review'}</h2>
                                        <p>{score === quiz.questions.length
                                            ? `Excellent work! You've successfully passed the verification stage for ${skill}.`
                                            : `You got some wrong. Review the concepts and chat with the AI assistant to clear your doubts before retrying.`}
                                        </p>
                                        {score === quiz.questions.length ? (
                                            <button className="btn btn--primary" onClick={onClose}>Finish & Earn Credits</button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                                <button className="btn btn--ghost" onClick={() => setTab('notes')}>Review Notes</button>
                                                <button className="btn btn--ghost" onClick={() => {
                                                    setQuizFinished(false)
                                                    setCurrentQ(0)
                                                    setAnswers([])
                                                }}>Retry Quiz</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
