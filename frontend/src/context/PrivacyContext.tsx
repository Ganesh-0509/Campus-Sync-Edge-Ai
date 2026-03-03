import { createContext, useContext } from 'react'

interface PrivacyCtx { privacy: boolean; setPrivacy: (v: boolean) => void }

export const PrivacyContext = createContext<PrivacyCtx | null>(null)

export function usePrivacy() {
    const ctx = useContext(PrivacyContext)
    if (!ctx) throw new Error('usePrivacy must be used inside a PrivacyProvider')
    return ctx
}
