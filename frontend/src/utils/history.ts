/** Persists score history in localStorage so Dashboard can show real trend */

const LS_KEY = 'cse_score_history'
const MAX_ENTRIES = 12

export interface HistoryEntry {
    label: string   // e.g. "Mar 1"
    value: number   // final_score
    role: string
}

export function saveScore(score: number, role: string): void {
    const hist = loadHistory()
    const now = new Date()
    const label = now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })

    // Avoid duplicate on the same calendar day
    const last = hist[hist.length - 1]
    if (last?.label === label) {
        last.value = score
        last.role = role
    } else {
        hist.push({ label, value: score, role })
        if (hist.length > MAX_ENTRIES) hist.shift()
    }

    localStorage.setItem(LS_KEY, JSON.stringify(hist))
}

export function loadHistory(): HistoryEntry[] {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
    catch { return [] }
}

/** Returns data seeded with demo entries if user has never uploaded */
export function getHistoryOrDemo(real: HistoryEntry[]): HistoryEntry[] {
    if (real.length >= 2) return real
    return [
        { label: 'Jan', value: 35 }, { label: 'Feb', value: 43 },
        { label: 'Mar', value: 50 }, { label: 'Apr', value: 58 },
        { label: 'May', value: 65 }, { label: 'Jun', value: 74 },
    ] as HistoryEntry[]
}
