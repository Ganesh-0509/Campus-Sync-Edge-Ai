import { NavLink, Outlet } from 'react-router-dom'
import {
    LayoutDashboard, FileText, BarChart2, ZapOff,
    CheckSquare, MessageSquare, TrendingUp, GitCompare,
    Building2, Settings
} from 'lucide-react'

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard Overview', Icon: LayoutDashboard },
    { to: '/resume-analyzer', label: 'Resume Analyzer', Icon: FileText },
    { to: '/readiness-score', label: 'Readiness Score', Icon: BarChart2 },
    { to: '/skill-gap', label: 'Skill Gap Analysis', Icon: ZapOff },
    { to: '/improvement-plan', label: 'Improvement Plan', Icon: CheckSquare },
    { to: '/interview-readiness', label: 'Interview Readiness', Icon: MessageSquare },
    { to: '/progress-tracking', label: 'Progress Tracking', Icon: TrendingUp },
    { to: '/resume-comparison', label: 'Resume Comparison', Icon: GitCompare },
    { to: '/industry-alignment', label: 'Industry Alignment', Icon: Building2 },
    { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function Layout() {
    return (
        <div className="app-shell">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar__logo">
                    <div className="sidebar__logo-icon">⚡</div>
                    <div className="sidebar__logo-name">CampusSync</div>
                    <div className="sidebar__logo-sub">Edge AI</div>
                </div>
                <nav className="sidebar__nav">
                    {NAV_ITEMS.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        >
                            <Icon className="nav-item__icon" size={16} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* ── Main ── */}
            <div className="main-area">
                <Navbar />
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

/* ── Inline Navbar to avoid extra file ──────────────────────── */
import { Search, Bell, Sun } from 'lucide-react'
import { useState } from 'react'

function Navbar() {
    const [dark, setDark] = useState(true)
    return (
        <header className="navbar">
            <div className="navbar__search">
                <Search className="navbar__search-icon" size={14} />
                <input placeholder="Search skills, features..." />
                <span className="navbar__shortcut">⌘K</span>
            </div>
            <div className="navbar__actions">
                <button className="navbar__btn" onClick={() => setDark(!dark)} title="Toggle theme">
                    <Sun size={15} />
                </button>
                <button className="navbar__btn" title="Notifications">
                    <Bell size={15} />
                </button>
                <div className="navbar__avatar" title="Profile">G</div>
            </div>
        </header>
    )
}
