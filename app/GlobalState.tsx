import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface GlobalState {
    theme: Theme,
    setTheme: (t: Theme) => void
}

export const useGlobalState = create<GlobalState>()(
    persist(
        set => ({
            theme: 'light',
            setTheme: (t: Theme) => set({theme: t})
        }), {
            name: 'bear-storage'
        }
    )
)