import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ResumeProvider } from './context/ResumeContext'
import Layout from './components/Layout'
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

export default function App() {
    return (
        <ResumeProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
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
                </Routes>
            </BrowserRouter>
        </ResumeProvider>
    )
}
