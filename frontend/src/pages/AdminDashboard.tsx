import { useState, useEffect } from 'react'
import { Check, X, Shield, Users, BookOpen, Clock, ChevronRight } from 'lucide-react'
import { getAdminStats, getPendingContributions, approveContribution, rejectContribution } from '../api/client'
import type { AdminStats, Contribution } from '../api/client'

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [contributions, setContributions] = useState<Contribution[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [s, c] = await Promise.all([
                getAdminStats(),
                getPendingContributions()
            ])
            setStats(s)
            setContributions(c)
        } catch (err) {
            console.error("Failed to load admin data:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleApprove = async (id: number) => {
        await approveContribution(id)
        fetchData()
    }

    const handleReject = async (id: number) => {
        await rejectContribution(id)
        fetchData()
    }

    if (loading) return (
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="spinner"></div>
        </div>
    )

    return (
        <div className="page-content">
            <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Shield size={28} className="text-blue" />
                    <h1 className="page-title" style={{ margin: 0 }}>Admin Portal</h1>
                </div>
                <p className="page-subtitle">Platform overview and community content moderation</p>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
                <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{stats?.active_students.toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Students</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{stats?.total_courses_cached}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Courses Cached</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{stats?.pending_reviews}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending Reviews</div>
                    </div>
                </div>
            </div>

            {/* Community Contributions */}
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                Pending Community Approvals <span className="badge badge--medium">{contributions.length}</span>
            </h2>

            {contributions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {contributions.map(c => (
                        <div key={c.id} className="card" style={{ padding: '24px', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Course: {c.topic.toUpperCase()}</h3>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        Submitted by: <strong style={{ color: 'var(--text-primary)' }}>{c.submitted_by}</strong> • {new Date(c.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn--outline" onClick={() => handleReject(c.id)} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                                        <X size={16} /> Reject
                                    </button>
                                    <button className="btn btn--primary" onClick={() => handleApprove(c.id)} style={{ background: 'var(--green)' }}>
                                        <Check size={16} /> Approve & Publish
                                    </button>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, fontSize: 13 }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Suggested Content Preview</div>
                                <pre style={{ fontFamily: 'var(--font)', whiteSpace: 'pre-wrap', margin: 0, color: 'var(--text-primary)' }}>
                                    {c.content ? c.content.substring(0, 300) + '...' : 'No preview available'}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ padding: 60, textAlign: 'center', borderStyle: 'dashed' }}>
                    <Check size={48} className="text-muted" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>All Caught Up!</h3>
                    <p style={{ color: 'var(--text-muted)' }}>There are no pending community contributions to review.</p>
                </div>
            )}
        </div>
    )
}
