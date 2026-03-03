import { createContext, useContext } from 'react'

interface PrivacyCtx { privacy: boolean; setPrivacy: (v: boolean) => void }

export const PrivacyContext = createContext<PrivacyCtx>({ privacy: false, setPrivacy: () => { } })

export function usePrivacy() { return useContext(PrivacyContext) }
