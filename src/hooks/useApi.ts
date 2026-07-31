import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// --- Profile ---
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<Profile>('/api/profile'),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'height_cm' | 'weight_unit' | 'sex' | 'birth_year' | 'training_days_per_week' | 'fitness_goal' | 'experience_level' | 'routine_preference' | 'onboarding_completed'>>) =>
      api.patch<Profile>('/api/profile', body),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data)
    },
  })
}

// --- Dashboard ---
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/api/stats/dashboard'),
  })
}

// --- Routines ---
export function useRoutines() {
  return useQuery({
    queryKey: ['routines'],
    queryFn: () => api.get<Routine[]>('/api/routines'),
  })
}

export function useRoutineDetail(id: string) {
  return useQuery({
    queryKey: ['routine', id],
    queryFn: () => api.get<RoutineDetail>(`/api/routines/${id}`),
    enabled: !!id,
  })
}

export function useCreateRoutineWithExercises() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      name: string
      is_favorite?: boolean
      assigned_day?: number | null
      exercises: {
        exercise_id: string
        order_index: number
        target_sets: number
        target_reps_min: number
        target_reps_max: number
        rest_seconds: number
      }[]
    }) => api.post<{ id: string }>('/api/routines/with-exercises', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  })
}

export function useAddRoutineExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ routineId, ...body }: { routineId: string; exercise_id: string; order_index: number; target_sets?: number; target_reps_min?: number; target_reps_max?: number; rest_seconds?: number }) =>
      api.post(`/api/routines/${routineId}/exercises`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  })
}

// --- Sessions ---
export function useStartSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (routineId: string) =>
      api.post<WorkoutSession>('/api/sessions', { routine_id: routineId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useFinishSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'completed' | 'cancelled' }) =>
      api.patch(`/api/sessions/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useSessionDetail(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => api.get<SessionDetail>(`/api/sessions/${id}`),
    enabled: !!id,
  })
}

export function useSessions(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['sessions', limit, offset],
    queryFn: () => api.get<SessionSummary[]>(`/api/sessions?limit=${limit}&offset=${offset}`),
  })
}

export function useLogSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, ...body }: LogSetInput & { sessionId: string }) =>
      api.post(`/api/sessions/${sessionId}/sets`, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['session', v.sessionId] }),
  })
}

export function useUpdateSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, setId, ...body }: UpdateSetInput & { sessionId: string; setId: string }) =>
      api.patch(`/api/sessions/${sessionId}/sets/${setId}`, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['session', v.sessionId] }),
  })
}

// --- Progress ---
export function useWeeklyVolume() {
  return useQuery({
    queryKey: ['weekly-volume'],
    queryFn: () => api.get<WeeklyVolume[]>('/api/stats/weekly-volume'),
  })
}

export function useTrainedExercises() {
  return useQuery({
    queryKey: ['trained-exercises'],
    queryFn: () => api.get<TrainedExercise[]>('/api/stats/trained-exercises'),
  })
}

export function useExerciseProgress(exerciseId: string, period = '3m') {
  return useQuery({
    queryKey: ['progress', exerciseId, period],
    queryFn: () => api.get<ExerciseProgress>(`/api/stats/exercises/${exerciseId}/progress?period=${period}`),
    enabled: !!exerciseId,
  })
}

export function useLogPastSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: LogPastSessionInput) =>
      api.post<{ id: string; sets_count: number }>('/api/sessions/log-past', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['weekly-volume'] })
      qc.invalidateQueries({ queryKey: ['trained-exercises'] })
    },
  })
}

// --- Body Measurements ---
export function useBodyMeasurements(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return useQuery({
    queryKey: ['body-measurements', from, to],
    queryFn: () => api.get<BodyMeasurement[]>(`/api/body-measurements${qs ? `?${qs}` : ''}`),
  })
}

export function useUpsertMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertMeasurementInput) => api.post('/api/body-measurements', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['body-measurements'] }),
  })
}

// --- Admin: Exercises ---
export function useExercises(muscleGroup?: string, search?: string) {
  const params = new URLSearchParams()
  if (muscleGroup) params.set('muscle_group', muscleGroup)
  if (search) params.set('search', search)
  const qs = params.toString()
  return useQuery({
    queryKey: ['exercises', muscleGroup, search],
    queryFn: () => api.get<Exercise[]>(`/api/exercises${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; muscle_group: string; equipment?: string; notes?: string; image_url?: string }) =>
      api.post<Exercise>('/api/exercises', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useUpdateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; muscle_group?: string; equipment?: string; notes?: string; image_url?: string }) =>
      api.patch<Exercise>(`/api/exercises/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useDeleteExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/exercises/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

// --- Types ---
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  height_cm: number | null
  weight_unit: string
  sex: 'male' | 'female' | null
  birth_year: number | null
  training_days_per_week: number | null
  fitness_goal: FitnessGoal | null
  experience_level: ExperienceLevel | null
  routine_preference: RoutinePreference | null
  onboarding_completed: boolean
  is_admin: boolean
  created_at: string
}

export type FitnessGoal = 'lose_fat' | 'gain_muscle' | 'improve_fitness' | 'increase_strength' | 'stay_healthy' | 'other'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type RoutinePreference = 'create_own' | 'receive_recommended'

export interface Exercise {
  id: string
  owner_id: string | null
  name: string
  muscle_group: string
  equipment: string | null
  image_url: string | null
  notes: string | null
  created_at: string
}

export interface DashboardData {
  streak: number
  this_week: {
    sessions: number
    total_volume_kg: number
  }
  training_days: boolean[]
  is_rest_day: boolean
  upcoming_routine: { name: string; day_label: string } | null
  next_routine: { id: string; name: string; exercise_count: number } | null
  last_session: {
    id: string
    routine_name_snapshot: string
    started_at: string
    duration_minutes: number
    total_sets: number
    total_volume_kg: number
    has_pr: boolean
  } | null
}

export interface Routine {
  id: string
  name: string
  is_favorite: boolean
  position: number
  assigned_day: number | null
  exercise_count: number
  last_completed: string | null
}

export interface RoutineExercise {
  id: string
  exercise_id: string
  order_index: number
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  rest_seconds: number
  notes: string | null
  exercises: {
    id: string
    name: string
    muscle_group: string
    equipment: string | null
    image_url: string | null
  }
}

export interface RoutineDetail {
  id: string
  name: string
  is_favorite: boolean
  position: number
  created_at: string
  updated_at: string
  routine_exercises: RoutineExercise[]
}

export interface WorkoutSession {
  id: string
  routine_id: string | null
  routine_name_snapshot: string
  status: 'in_progress' | 'completed' | 'cancelled'
  started_at: string
  ended_at: string | null
}

export interface SessionSet {
  id: string
  exercise_id: string
  exercise_name: string
  muscle_group: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  is_completed: boolean
  is_personal_record: boolean
}

export interface SessionDetail extends WorkoutSession {
  sets: SessionSet[]
}

export interface SessionSummary {
  id: string
  routine_name_snapshot: string
  status: string
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  total_sets: number
  total_volume_kg: number
  has_pr: boolean
}

export interface LogSetInput {
  exercise_id: string
  set_number: number
  reps: number
  weight_kg: number
}

export interface UpdateSetInput {
  reps?: number
  weight_kg?: number
  is_completed?: boolean
}

export interface WeeklyVolume {
  week: string
  volume_kg: number
}

export interface TrainedExercise {
  exercise_id: string
  name: string
  muscle_group: string
  best_weight_kg: number
  total_sets: number
  last_performed: string
}

export interface ExerciseProgress {
  exercise_name: string | null
  muscle_group: string | null
  personal_record: { weight_kg: number; date: string } | null
  volume_this_month: number
  volume_change_pct: number | null
  chart_data: { date: string; weight_kg: number }[]
  recent_sessions: {
    session_id: string
    date: string
    sets: { reps: number; weight_kg: number; is_pr: boolean }[]
    has_pr: boolean
    total_volume: number
  }[]
}

export interface BodyMeasurement {
  id: string
  recorded_on: string
  weight_kg: number | null
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  visceral_fat_level: number | null
  notes: string | null
}

export interface UpsertMeasurementInput {
  recorded_on: string
  weight_kg?: number
  body_fat_pct?: number
  muscle_mass_kg?: number
  visceral_fat_level?: number
  notes?: string
}

export interface LogPastSessionInput {
  routine_name: string
  date: string
  duration_minutes?: number
  exercises: {
    exercise_id: string
    sets: { reps: number; weight_kg: number }[]
  }[]
}
