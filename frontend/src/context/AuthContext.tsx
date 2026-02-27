import { createContext, useContext, useState, ReactNode } from 'react'

interface User { name: string; email: string }
interface AuthState {
    user: User | null
    login: (email: string, password: string) => Promise<void>
    signup: (name: string, email: string, password: string) => Promise<void>
    logout: () => void
}

const Ctx = createContext<AuthState | null>(null)
const LS = 'cse_user'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try { return JSON.parse(localStorage.getItem(LS) || 'null') }
        catch { return null }
    })

    const login = async (email: string, _: string) => {
        // Demo: accept any credentials (swap with Supabase auth later)
        const u: User = { name: email.split('@')[0], email }
        setUser(u)
        localStorage.setItem(LS, JSON.stringify(u))
    }

    const signup = async (name: string, email: string, _: string) => {
        const u: User = { name, email }
        setUser(u)
        localStorage.setItem(LS, JSON.stringify(u))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem(LS)
    }

    return <Ctx.Provider value={{ user, login, signup, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useAuth must be inside AuthProvider')
    return ctx
}
