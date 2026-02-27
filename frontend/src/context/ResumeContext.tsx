import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { UploadResult, PredictResult } from '../api/client'

export interface ResumeState {
    analysis: UploadResult | null
    prediction: PredictResult | null
    previousAnalysis: UploadResult | null
    setAnalysis: (a: UploadResult) => void
    setPrediction: (p: PredictResult) => void
    clear: () => void
}

const Ctx = createContext<ResumeState | null>(null)

const LS_KEY_ANALYSIS = 'cse_analysis'
const LS_KEY_PREDICTION = 'cse_prediction'
const LS_KEY_PREV = 'cse_prev_analysis'

function loadJson<T>(key: string): T | null {
    try { return JSON.parse(localStorage.getItem(key) || 'null') }
    catch { return null }
}

export function ResumeProvider({ children }: { children: ReactNode }) {
    const [analysis, setAnalysisState] = useState<UploadResult | null>(loadJson(LS_KEY_ANALYSIS))
    const [prediction, setPredictionState] = useState<PredictResult | null>(loadJson(LS_KEY_PREDICTION))
    const [previousAnalysis, setPreviousAnalysisState] = useState<UploadResult | null>(loadJson(LS_KEY_PREV))

    const setAnalysis = (a: UploadResult) => {
        // Move current to previous before replacing
        if (analysis) {
            setPreviousAnalysisState(analysis)
            localStorage.setItem(LS_KEY_PREV, JSON.stringify(analysis))
        }
        setAnalysisState(a)
        localStorage.setItem(LS_KEY_ANALYSIS, JSON.stringify(a))
    }

    const setPrediction = (p: PredictResult) => {
        setPredictionState(p)
        localStorage.setItem(LS_KEY_PREDICTION, JSON.stringify(p))
    }

    const clear = () => {
        setAnalysisState(null)
        setPredictionState(null)
        setPreviousAnalysisState(null)
        localStorage.removeItem(LS_KEY_ANALYSIS)
        localStorage.removeItem(LS_KEY_PREDICTION)
        localStorage.removeItem(LS_KEY_PREV)
    }

    return (
        <Ctx.Provider value={{ analysis, prediction, previousAnalysis, setAnalysis, setPrediction, clear }}>
            {children}
        </Ctx.Provider>
    )
}

export function useResume() {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useResume must be inside ResumeProvider')
    return ctx
}

// ── Derived helpers ──────────────────────────────────────────

export function getReadinessClass(score: number): 'Beginner' | 'Developing' | 'Placement Ready' | 'Interview Ready' {
    if (score < 40) return 'Beginner'
    if (score < 61) return 'Developing'
    if (score < 81) return 'Placement Ready'
    return 'Interview Ready'
}

export function getIndustryAlignment(score: number): { service: number; product: number; startup: number } {
    return {
        service: Math.min(100, Math.round(score * 1.08)),
        product: Math.min(100, Math.round(score * 0.85)),
        startup: Math.min(100, Math.round(score * 0.75)),
    }
}

export function getImprovementPlan(
    missingCore: string[],
    missingOptional: string[],
    recs: Array<{ skill: string; priority: string }>
) {
    const highPri = recs.filter(r => r.priority === 'HIGH').map(r => r.skill)
    const medPri = recs.filter(r => r.priority === 'MEDIUM').map(r => r.skill)

    return [
        {
            days: 'Day 1–2',
            title: missingCore[0] ? `${missingCore[0]} Fundamentals` : 'Data Structures & Algorithms Practice',
            tags: missingCore.slice(0, 3).length ? missingCore.slice(0, 3) : ['Arrays', 'Linked Lists', 'Trees'],
            done: false,
        },
        {
            days: 'Day 3–4',
            title: highPri[0] ? `${highPri[0]} Deep Dive` : 'Backend Framework Deep Dive',
            tags: highPri.slice(0, 3).length ? highPri.slice(0, 3) : ['Node.js', 'Express', 'REST API Design'],
            done: false,
        },
        {
            days: 'Day 5–6',
            title: medPri[0] ? `${medPri[0]} Basics` : 'System Design Basics',
            tags: medPri.slice(0, 3).length ? medPri.slice(0, 3) : ['Scalability', 'Load Balancing', 'Caching'],
            done: false,
        },
        {
            days: 'Day 7',
            title: 'Build Mini Project',
            tags: ['Full-stack app', 'Deploy to cloud'],
            done: false,
        },
    ]
}
