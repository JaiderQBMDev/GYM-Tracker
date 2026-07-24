import { create } from 'zustand'

interface ActiveSession {
  id: string
  routineId: string
  routineName: string
  startedAt: string
  currentExerciseIndex: number
}

interface SessionState {
  active: ActiveSession | null
  setActive: (session: ActiveSession | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  active: null,
  setActive: (session) => set({ active: session }),
}))
