import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ResumeProvider } from './context/ResumeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ResumeAnalyzer from './pages/ResumeAnalyzer'
import ReadinessScore from './pages/ReadinessScore'
import SkillGap from './pages/SkillGap'
import ImprovementPlan from './pages/ImprovementPlan'
import InterviewReadiness from './pages/InterviewReadiness'
import ProgressTracking from './pages/ProgressTracking'
import ResumeComparison from './pages/ResumeComparison'
import IndustryAlignment from './pages/IndustryAlignment'
import Settings from './pages/Settings'

/** Guard: redirect to /login if not authed */
function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
    const { user } = useAuth()
    return (
        <Routes>
            {/* Auth routes (only when not logged in) */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

            {/* Protected dashboard routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="resume-analyzer" element={<ResumeAnalyzer />} />
                <Route path="readiness-score" element={<ReadinessScore />} />
                <Route path="skill-gap" element={<SkillGap />} />
                <Route path="improvement-plan" element={<ImprovementPlan />} />
                <Route path="interview-readiness" element={<InterviewReadiness />} />
                <Route path="progress-tracking" element={<ProgressTracking />} />
                <Route path="resume-comparison" element={<ResumeComparison />} />
                <Route path="industry-alignment" element={<IndustryAlignment />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <ResumeProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </ResumeProvider>
        </AuthProvider>
    )
}
