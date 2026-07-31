import { create } from 'zustand'
import type { Exercise } from '../hooks/useApi'

export interface RoutineExerciseEntry {
  exercise: Exercise
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  rest_seconds: number
}

interface RoutineBuilderState {
  name: string
  assignedDay: number | null
  exercises: RoutineExerciseEntry[]
  setName: (name: string) => void
  setAssignedDay: (day: number | null) => void
  addExercise: (entry: RoutineExerciseEntry) => void
  removeExercise: (exerciseId: string) => void
  updateExercise: (exerciseId: string, updates: Partial<Omit<RoutineExerciseEntry, 'exercise'>>) => void
  hasExercise: (exerciseId: string) => boolean
  reset: () => void
}

export const useRoutineBuilder = create<RoutineBuilderState>((set, get) => ({
  name: '',
  assignedDay: null,
  exercises: [],
  setName: (name) => set({ name }),
  setAssignedDay: (assignedDay) => set({ assignedDay }),
  addExercise: (entry) =>
    set((s) => {
      if (s.exercises.some((e) => e.exercise.id === entry.exercise.id)) return s
      return { exercises: [...s.exercises, entry] }
    }),
  removeExercise: (exerciseId) =>
    set((s) => ({ exercises: s.exercises.filter((e) => e.exercise.id !== exerciseId) })),
  updateExercise: (exerciseId, updates) =>
    set((s) => ({
      exercises: s.exercises.map((e) =>
        e.exercise.id === exerciseId ? { ...e, ...updates } : e,
      ),
    })),
  hasExercise: (exerciseId) => get().exercises.some((e) => e.exercise.id === exerciseId),
  reset: () => set({ name: '', assignedDay: null, exercises: [] }),
}))
