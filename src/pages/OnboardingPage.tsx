import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router'
import { Dumbbell, ChevronRight, ChevronLeft, Plus, X, Search } from 'lucide-react'
import {
  useUpdateProfile,
  useUpsertMeasurement,
  useExercises,
  useCreateRoutineWithExercises,
} from '../hooks/useApi'
import type { FitnessGoal, ExperienceLevel, RoutinePreference, Exercise } from '../hooks/useApi'
import { useAuthStore } from '../stores/auth'

type Step =
  | 'welcome'
  | 'sex_age'
  | 'body'
  | 'inbody'
  | 'training'
  | 'goal'
  | 'experience'
  | 'routine_preference'
  | 'summary'
  | 'create_routine'

const WIZARD_STEPS: Step[] = [
  'welcome',
  'sex_age',
  'body',
  'inbody',
  'training',
  'goal',
  'experience',
  'routine_preference',
  'summary',
]

const GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_fat', label: 'Perder grasa' },
  { value: 'gain_muscle', label: 'Ganar masa muscular' },
  { value: 'improve_fitness', label: 'Mejorar condición física' },
  { value: 'increase_strength', label: 'Aumentar fuerza' },
  { value: 'stay_healthy', label: 'Mantenerme saludable' },
]

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Principiante', description: 'Menos de 6 meses entrenando' },
  { value: 'intermediate', label: 'Intermedio', description: 'Entre 6 meses y 2 años' },
  { value: 'advanced', label: 'Avanzado', description: 'Más de 2 años de experiencia' },
]

const ROUTINE_OPTIONS: { value: RoutinePreference; label: string; description: string }[] = [
  { value: 'receive_recommended', label: 'Recibir una rutina recomendada', description: 'Te sugerimos una rutina personalizada según tu perfil' },
  { value: 'create_own', label: 'Crear mi propia rutina', description: 'Diseña tu rutina desde cero con nuestro constructor' },
]

const GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_fat: 'Perder grasa',
  gain_muscle: 'Ganar músculo',
  improve_fitness: 'Mejorar fitness',
  increase_strength: 'Fuerza',
  stay_healthy: 'Salud',
  other: 'General',
}

const GOAL_MUSCLE_GROUPS: Record<FitnessGoal, string[]> = {
  lose_fat: ['cardio', 'piernas', 'espalda', 'pecho', 'abdomen'],
  gain_muscle: ['pecho', 'espalda', 'piernas', 'hombros', 'biceps', 'triceps'],
  improve_fitness: ['piernas', 'espalda', 'pecho', 'hombros', 'abdomen', 'cardio'],
  increase_strength: ['piernas', 'espalda', 'pecho', 'hombros'],
  stay_healthy: ['piernas', 'espalda', 'pecho', 'cardio', 'abdomen'],
  other: ['pecho', 'espalda', 'piernas', 'hombros'],
}

interface SelectedExercise {
  exercise: Exercise
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  rest_seconds: number
}

function getSuggestedExerciseCount(level: ExperienceLevel | null): number {
  if (level === 'beginner') return 4
  if (level === 'advanced') return 7
  return 6
}

function getSuggestedRoutineName(goal: FitnessGoal | null): string {
  const label = goal ? GOAL_LABELS[goal] : 'General'
  return `Día 1 — ${label}`
}

function getSuggestionText(
  level: ExperienceLevel | null,
  days: number | null,
  goal: FitnessGoal | null,
): string {
  const levelLabel = level === 'beginner' ? 'Principiante' : level === 'advanced' ? 'Avanzado' : 'Intermedio'
  const goalLabel = goal ? GOAL_LABELS[goal].toLowerCase() : 'general'
  const count = getSuggestedExerciseCount(level)
  return `${levelLabel} · ${days ?? '?'} días · ${goalLabel}: te proponemos empezar con ${count - 1}–${count} ejercicios de empuje. Añádelos de una vez o elige los tuyos.`
}

function pickSuggestedExercises(
  allExercises: Exercise[],
  goal: FitnessGoal | null,
  level: ExperienceLevel | null,
): Exercise[] {
  const groups = GOAL_MUSCLE_GROUPS[goal ?? 'other']
  const count = getSuggestedExerciseCount(level)
  const picked: Exercise[] = []
  const usedIds = new Set<string>()

  for (const group of groups) {
    if (picked.length >= count) break
    const candidates = allExercises.filter(
      (e) => e.muscle_group === group && !usedIds.has(e.id) && !e.owner_id,
    )
    if (candidates.length > 0) {
      const ex = candidates[0]
      picked.push(ex)
      usedIds.add(ex.id)
    }
  }

  if (picked.length < count) {
    for (const ex of allExercises) {
      if (picked.length >= count) break
      if (!usedIds.has(ex.id) && !ex.owner_id) {
        picked.push(ex)
        usedIds.add(ex.id)
      }
    }
  }

  return picked
}

export function OnboardingPage() {
  const { session, loading } = useAuthStore()
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const upsertMeasurement = useUpsertMeasurement()
  const createRoutine = useCreateRoutineWithExercises()

  const [step, setStep] = useState<Step>('welcome')
  const [sex, setSex] = useState<'male' | 'female' | null>(null)
  const [age, setAge] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [bodyFatPct, setBodyFatPct] = useState('')
  const [muscleMassKg, setMuscleMassKg] = useState('')
  const [visceralFatLevel, setVisceralFatLevel] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const trainingDays = selectedDays.length || null
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null)
  const [routinePreference, setRoutinePreference] = useState<RoutinePreference | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Create routine step state
  const [routineAssignedDay, setRoutineAssignedDay] = useState<number | null>(null)
  const [routineName, setRoutineName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [savingRoutine, setSavingRoutine] = useState(false)

  const { data: allExercises } = useExercises()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  const wizardIndex = WIZARD_STEPS.indexOf(step as any)
  const isWizardStep = wizardIndex >= 0
  const totalSteps = WIZARD_STEPS.length
  const progressPct = isWizardStep && wizardIndex > 0
    ? Math.round((wizardIndex / (totalSteps - 1)) * 100)
    : 0

  const handleNext = () => {
    if (!isWizardStep) return
    const next = WIZARD_STEPS[wizardIndex + 1]
    if (next) setStep(next)
  }

  const handleBack = () => {
    if (step === 'create_routine') {
      setStep('summary')
      return
    }
    if (!isWizardStep) return
    const prev = WIZARD_STEPS[wizardIndex - 1]
    if (prev) setStep(prev)
  }

  const bmi =
    heightCm && weightKg
      ? (parseFloat(weightKg) / (parseFloat(heightCm) / 100) ** 2).toFixed(1)
      : null

  const bmiCategory = (v: number) => {
    if (v < 18.5) return 'Bajo peso'
    if (v < 25) return 'Normal'
    if (v < 30) return 'Sobrepeso'
    return 'Obesidad'
  }

  const trainingHint = (days: number) => {
    if (days <= 2) return `${days} días — ideal para full body`
    if (days <= 3) return `${days} días — ideal para push / pull / pierna`
    if (days <= 4) return `${days} días — ideal para una rutina de torso / pierna`
    if (days <= 5) return `${days} días — ideal para una división por músculo`
    return `${days} días — alto volumen de entrenamiento`
  }

  const saveProfileAndMeasurements = async () => {
    const birthYear = age ? new Date().getFullYear() - parseInt(age) : undefined
    const profileBody: Record<string, unknown> = {
      weight_unit: weightUnit,
      training_days_per_week: trainingDays,
      fitness_goal: fitnessGoal,
      experience_level: experienceLevel,
      routine_preference: routinePreference,
      onboarding_completed: true,
    }
    if (sex) profileBody.sex = sex
    if (birthYear) profileBody.birth_year = birthYear
    if (heightCm) profileBody.height_cm = parseFloat(heightCm)
    await updateProfile.mutateAsync(profileBody as any)

    const measurementBody: Record<string, unknown> = {
      recorded_on: new Date().toISOString().slice(0, 10),
    }
    if (weightKg) measurementBody.weight_kg = parseFloat(weightKg)
    if (bodyFatPct) measurementBody.body_fat_pct = parseFloat(bodyFatPct)
    if (muscleMassKg) measurementBody.muscle_mass_kg = parseFloat(muscleMassKg)
    if (visceralFatLevel) measurementBody.visceral_fat_level = parseInt(visceralFatLevel)

    if (Object.keys(measurementBody).length > 1) {
      await upsertMeasurement.mutateAsync(measurementBody as any)
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    setError('')
    try {
      await saveProfileAndMeasurements()
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar tu perfil. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleGoToCreateRoutine = async () => {
    setSaving(true)
    setError('')
    try {
      await saveProfileAndMeasurements()
      setRoutineName(getSuggestedRoutineName(fitnessGoal))
      setRoutineAssignedDay(selectedDays[0] ?? null)
      setStep('create_routine')
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar tu perfil. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleUseSuggestion = () => {
    if (!allExercises) return
    const suggested = pickSuggestedExercises(allExercises, fitnessGoal, experienceLevel)
    setSelectedExercises(suggested.map((ex) => ({
      exercise: ex,
      target_sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
      rest_seconds: 90,
    })))
  }

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.exercise.id !== id))
  }

  const handleAddExercise = (exercise: Exercise) => {
    if (selectedExercises.some((e) => e.exercise.id === exercise.id)) return
    setSelectedExercises((prev) => [...prev, {
      exercise,
      target_sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
      rest_seconds: 90,
    }])
    setShowExercisePicker(false)
    setExerciseSearch('')
  }

  const handleUpdateExerciseConfig = (index: number, field: keyof SelectedExercise, value: number) => {
    setSelectedExercises((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  const handleSaveRoutine = async () => {
    if (selectedExercises.length === 0 || !routineName.trim()) return
    setSavingRoutine(true)
    setError('')
    try {
      await createRoutine.mutateAsync({
        name: routineName.trim(),
        assigned_day: routineAssignedDay,
        exercises: selectedExercises.map((sel, i) => ({
          exercise_id: sel.exercise.id,
          order_index: i,
          target_sets: sel.target_sets,
          target_reps_min: sel.target_reps_min,
          target_reps_max: sel.target_reps_max,
          rest_seconds: sel.rest_seconds,
        })),
      })
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear la rutina. Intenta de nuevo.')
    } finally {
      setSavingRoutine(false)
    }
  }

  const goalLabel = GOAL_OPTIONS.find((o) => o.value === fitnessGoal)?.label

  const filteredExercises = allExercises?.filter((e) => {
    if (!exerciseSearch) return true
    return (
      e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      e.muscle_group.toLowerCase().includes(exerciseSearch.toLowerCase())
    )
  })

  const exercisesByGroup = filteredExercises?.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const group = ex.muscle_group
    if (!acc[group]) acc[group] = []
    acc[group].push(ex)
    return acc
  }, {})

  return (
    <div className="flex-1 flex flex-col bg-bg relative overflow-hidden">
      {/* Header: back + step counter + progress bar (wizard steps only) */}
      {isWizardStep && step !== 'welcome' && step !== 'summary' && (
        <div className="pt-5 px-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleBack} className="text-text-secondary p-1 -ml-1">
              <ChevronLeft size={20} />
            </button>
            <span className="text-[11px] tracking-[0.1em] text-text-secondary">
              {String(wizardIndex + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
            </span>
          </div>
          <div className="h-[2px] bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Create routine step — full-height layout, no centering */}
      {step === 'create_routine' ? (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4">
            <span className="text-[11px] tracking-[0.1em] uppercase text-accent block mb-2">
              Paso final del onboarding
            </span>
            <h2 className="text-[26px] font-bold mb-5 tracking-wide">Tu primera rutina</h2>

            <label className="text-[12px] text-text-secondary mb-2 block">Nombre de la rutina</label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="w-full bg-surface border border-border px-4 py-3 text-[15px] font-medium text-text focus:outline-none focus:border-accent mb-5"
            />

            {selectedDays.length > 0 && (
              <>
                <label className="text-[12px] text-text-secondary mb-2 block">Día asignado</label>
                <div className="flex gap-2 mb-5">
                  {selectedDays.map((dayIdx) => {
                    const labels = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D']
                    return (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => setRoutineAssignedDay(routineAssignedDay === dayIdx ? null : dayIdx)}
                        className={`h-[40px] w-[40px] text-[14px] font-medium transition-colors ${
                          routineAssignedDay === dayIdx
                            ? 'bg-accent text-bg font-bold border border-accent'
                            : 'bg-transparent border border-border text-text'
                        }`}
                      >
                        {labels[dayIdx]}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* Suggestion card */}
            <div className="border border-dashed border-border p-4 mb-6">
              <p className="text-sm font-bold mb-1">Sugerencia según tu perfil</p>
              <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
                {getSuggestionText(experienceLevel, trainingDays, fitnessGoal)}
              </p>
              <button
                onClick={handleUseSuggestion}
                disabled={!allExercises || allExercises.length === 0}
                className="w-full border border-border py-2.5 text-sm font-bold text-text disabled:opacity-40"
              >
                Usar sugerencia ({getSuggestedExerciseCount(experienceLevel)} ejercicios)
              </button>
            </div>

            {/* Exercise list */}
            <span className="text-[11px] tracking-[0.08em] uppercase text-text-secondary font-semibold block mb-3">
              Ejercicios · {selectedExercises.length}
            </span>

            {selectedExercises.length > 0 ? (
              <div className="flex flex-col gap-2 mb-4">
                {selectedExercises.map((sel, i) => (
                  <div key={sel.exercise.id}>
                    <div
                      className={`bg-surface border rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer ${editingExerciseIndex === i ? 'border-accent rounded-b-none' : 'border-border'}`}
                      onClick={() => setEditingExerciseIndex(editingExerciseIndex === i ? null : i)}
                    >
                      <span className="text-[12px] text-text-secondary font-medium w-5 text-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{sel.exercise.name}</p>
                        <p className="text-[11px] text-text-secondary capitalize">
                          {sel.exercise.muscle_group} · {sel.target_sets} × {sel.target_reps_min}–{sel.target_reps_max} · {sel.rest_seconds}s
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveExercise(sel.exercise.id) }}
                        className="text-text-secondary p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {editingExerciseIndex === i && (
                      <div className="bg-surface border border-t-0 border-accent rounded-b-lg px-4 py-3 flex gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] text-text-secondary block mb-1">Series</label>
                          <input
                            type="number"
                            value={sel.target_sets}
                            onChange={(e) => handleUpdateExerciseConfig(i, 'target_sets', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-surface-alt border border-border rounded px-2 py-1.5 text-[13px] text-text text-center focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-text-secondary block mb-1">Reps mín</label>
                          <input
                            type="number"
                            value={sel.target_reps_min}
                            onChange={(e) => handleUpdateExerciseConfig(i, 'target_reps_min', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-surface-alt border border-border rounded px-2 py-1.5 text-[13px] text-text text-center focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-text-secondary block mb-1">Reps máx</label>
                          <input
                            type="number"
                            value={sel.target_reps_max}
                            onChange={(e) => handleUpdateExerciseConfig(i, 'target_reps_max', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-surface-alt border border-border rounded px-2 py-1.5 text-[13px] text-text text-center focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-text-secondary block mb-1">Descanso</label>
                          <input
                            type="number"
                            value={sel.rest_seconds}
                            onChange={(e) => handleUpdateExerciseConfig(i, 'rest_seconds', Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-surface-alt border border-border rounded px-2 py-1.5 text-[13px] text-text text-center focus:outline-none focus:border-accent"
                          />
                          <span className="text-[9px] text-text-secondary block text-center mt-0.5">seg</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Add exercise button */}
            <button
              onClick={() => setShowExercisePicker(true)}
              className="w-full border border-dashed border-border rounded-lg py-4 text-sm text-text-secondary font-medium flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              Añadir {selectedExercises.length === 0 ? 'mi primer ejercicio' : 'otro ejercicio'}
            </button>
          </div>

          {/* Bottom CTA — fixed */}
          <div className="px-6 pb-6 pt-3 border-t border-border bg-bg">
            {error && (
              <p className="text-red text-[13px] text-center mb-3">{error}</p>
            )}
            <button
              onClick={handleSaveRoutine}
              disabled={selectedExercises.length === 0 || savingRoutine}
              className="w-full bg-accent text-bg font-bold py-3.5 text-sm disabled:opacity-40"
            >
              {savingRoutine ? 'Guardando...' : 'Guardar y empezar a entrenar'}
            </button>
            {selectedExercises.length === 0 && (
              <p className="text-[11px] text-text-secondary text-center mt-2">
                Añade al menos 1 ejercicio para guardar
              </p>
            )}
          </div>

          {/* Exercise picker modal */}
          {showExercisePicker && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-end">
              <div className="w-full bg-surface rounded-t-2xl max-h-[85vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-between items-center px-5 pt-5 pb-3">
                  <h3 className="text-lg font-bold">Añadir ejercicio</h3>
                  <button
                    onClick={() => { setShowExercisePicker(false); setExerciseSearch('') }}
                    className="text-text-secondary p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="px-5 mb-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Buscar ejercicio..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="w-full bg-surface-alt border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                  {exercisesByGroup && Object.keys(exercisesByGroup).length > 0 ? (
                    Object.entries(exercisesByGroup).map(([group, exercises]) => (
                      <div key={group} className="mb-4">
                        <span className="text-[11px] uppercase tracking-[0.08em] text-text-secondary font-semibold block mb-2 capitalize">
                          {group}
                        </span>
                        {exercises.map((ex) => {
                          const alreadyAdded = selectedExercises.some((s) => s.exercise.id === ex.id)
                          return (
                            <button
                              key={ex.id}
                              onClick={() => !alreadyAdded && handleAddExercise(ex)}
                              disabled={alreadyAdded}
                              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 border-b border-border/30 ${
                                alreadyAdded ? 'opacity-40' : 'active:bg-surface-alt'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium truncate">{ex.name}</p>
                                {ex.equipment && (
                                  <p className="text-[11px] text-text-secondary">{ex.equipment}</p>
                                )}
                              </div>
                              {alreadyAdded ? (
                                <span className="text-[11px] text-accent font-medium">Añadido</span>
                              ) : (
                                <Plus size={16} className="text-text-secondary flex-shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary text-center py-8">
                      No se encontraron ejercicios
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* All wizard steps — centered layout */
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 overflow-y-auto">
          {/* Step 1: Welcome */}
          {step === 'welcome' && (
            <>
              <div className="w-[76px] h-[76px] bg-surface border border-accent-border flex items-center justify-center mb-6">
                <Dumbbell size={34} className="text-accent" />
              </div>
              <span className="text-[11px] tracking-[0.1em] uppercase text-accent mb-2">
                Seguimiento de progreso
              </span>
              <h1 className="text-[32px] font-bold mb-3 text-center tracking-wide">GYM TRACKER</h1>
              <p className="text-text-secondary text-sm text-center max-w-[300px] mb-10 leading-relaxed">
                Vamos a configurar tu perfil para personalizar tu experiencia de entrenamiento.
              </p>
              <button
                onClick={handleNext}
                className="w-full max-w-xs bg-accent text-bg font-bold py-3 text-sm flex items-center justify-center gap-2"
              >
                Comenzar
                <ChevronRight size={16} />
              </button>
              <span className="text-[11px] tracking-[0.1em] text-text-secondary mt-12">
                PASO 01 / {String(totalSteps).padStart(2, '0')}
              </span>
            </>
          )}

          {/* Step 2: Sex and age */}
          {step === 'sex_age' && (
            <div className="w-full max-w-xs flex flex-col">
              <h2 className="text-[26px] font-bold mb-1 tracking-wide">¿Quién entrena?</h2>
              <p className="text-text-secondary text-[13px] mb-6">
                Esto nos ayuda a personalizar tus métricas.
              </p>

              <label className="text-[12px] text-text-secondary mb-2 block">Sexo</label>
              <div className="flex border border-border overflow-hidden mb-5">
                {(['male', 'female'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`flex-1 py-2.5 text-[13px] font-medium text-center transition-colors ${
                      sex === s
                        ? 'bg-accent text-bg'
                        : 'bg-surface-alt text-text border-r border-border last:border-r-0'
                    }`}
                  >
                    {s === 'male' ? 'Masculino' : 'Femenino'}
                  </button>
                ))}
              </div>

              <label className="text-[12px] text-text-secondary mb-2 block">Edad</label>
              <input
                type="number"
                placeholder="Ej: 22"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-surface-alt border border-border px-3 py-2.5 text-[16px] text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
              />

              <button
                onClick={handleNext}
                disabled={!sex || !age}
                className="w-full bg-accent text-bg font-bold py-3 text-sm mt-8 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Step 3: Body basics (height + weight) */}
          {step === 'body' && (
            <div className="w-full max-w-xs flex flex-col">
              <h2 className="text-[26px] font-bold mb-1 tracking-wide">Tus medidas</h2>
              <p className="text-text-secondary text-[13px] mb-6">
                Esto nos ayuda a calcular tu IMC y seguir tu progreso.
              </p>

              <label className="text-[12px] text-text-secondary mb-2 block">Estatura (cm)</label>
              <input
                type="number"
                placeholder="Ej: 175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full bg-surface-alt border border-border px-3 py-2.5 text-[16px] text-text placeholder:text-text-secondary focus:outline-none focus:border-accent mb-4"
              />

              <label className="text-[12px] text-text-secondary mb-2 block">Peso actual</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  placeholder="Ej: 70"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  step="0.1"
                  className="flex-1 bg-surface-alt border border-border px-3 py-2.5 text-[16px] text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
                />
                <div className="flex border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('kg')}
                    className={`px-3 py-2 text-[13px] font-medium transition-colors ${
                      weightUnit === 'kg' ? 'bg-accent text-bg' : 'bg-surface-alt text-text-secondary'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('lb')}
                    className={`px-3 py-2 text-[13px] font-medium border-l border-border transition-colors ${
                      weightUnit === 'lb' ? 'bg-accent text-bg' : 'bg-surface-alt text-text-secondary'
                    }`}
                  >
                    lb
                  </button>
                </div>
              </div>

              {bmi && (
                <div className="border border-accent-border p-4 mb-4">
                  <span className="text-[11px] tracking-[0.08em] uppercase text-text-secondary block mb-1">
                    Tu IMC
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[24px] font-bold">{bmi}</span>
                    <span className="text-[11px] px-2 py-0.5 bg-accent-dim text-accent font-medium">
                      {bmiCategory(parseFloat(bmi))}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full bg-accent text-bg font-bold py-3 text-sm mt-4"
              >
                Siguiente
              </button>
              <button onClick={handleNext} className="text-text-secondary text-sm font-medium mt-3 text-center">
                Omitir por ahora
              </button>
            </div>
          )}

          {/* Step 4: InBody composition (optional) */}
          {step === 'inbody' && (
            <div className="w-full max-w-xs flex flex-col">
              <span className="text-[11px] tracking-[0.1em] uppercase text-accent mb-2">Opcional</span>
              <h2 className="text-[26px] font-bold mb-1 tracking-wide">¿Tienes un informe InBody?</h2>
              <p className="text-text-secondary text-[13px] mb-6">
                Si conoces estos datos, nos ayudan a darte un mejor seguimiento.
              </p>

              <label className="text-[12px] text-text-secondary mb-2 block">PGC — porcentaje de grasa (%)</label>
              <input
                type="number"
                placeholder="Ej: 18"
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                step="0.1"
                className="w-full bg-surface-alt border border-border px-3 py-2.5 text-[16px] text-text placeholder:text-text-secondary focus:outline-none focus:border-accent mb-4"
              />

              <label className="text-[12px] text-text-secondary mb-2 block">MME — masa muscular (kg)</label>
              <input
                type="number"
                placeholder="Ej: 35"
                value={muscleMassKg}
                onChange={(e) => setMuscleMassKg(e.target.value)}
                step="0.1"
                className="w-full bg-surface-alt border border-border px-3 py-2.5 text-[16px] text-text placeholder:text-text-secondary focus:outline-none focus:border-accent mb-4"
              />

              <label className="text-[12px] text-text-secondary mb-2 block">Grasa visceral (nivel 1–20)</label>
              <input
                type="number"
                placeholder="Ej: 5"
                value={visceralFatLevel}
                onChange={(e) => setVisceralFatLevel(e.target.value)}
                min="1"
                max="20"
                className="w-full bg-surface-alt border border-border px-3 py-2.5 text-[16px] text-text placeholder:text-text-secondary focus:outline-none focus:border-accent mb-1"
              />
              <span className="text-[11px] text-text-secondary mb-4">
                Lo encuentras en tu informe InBody o báscula inteligente.
              </span>

              <button
                onClick={handleNext}
                className="w-full bg-accent text-bg font-bold py-3 text-sm mt-4"
              >
                Siguiente
              </button>
              <button onClick={handleNext} className="text-text-secondary text-sm font-medium mt-3 text-center">
                Omitir por ahora
              </button>
            </div>
          )}

          {/* Step 5: Training frequency */}
          {step === 'training' && (
            <div className="w-full max-w-xs flex flex-col items-center">
              <h2 className="text-[26px] font-bold mb-1 tracking-wide text-center">¿Qué días entrenas?</h2>
              <p className="text-text-secondary text-[13px] mb-8 text-center">
                Selecciona los días de la semana que entrenas.
              </p>

              <div className="grid grid-cols-7 gap-2 w-full mb-4">
                {(['L', 'M', 'Mi', 'J', 'V', 'S', 'D']).map((label, i) => {
                  const isSelected = selectedDays.includes(i)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setSelectedDays((prev) =>
                          isSelected ? prev.filter((d) => d !== i) : [...prev, i].sort()
                        )
                      }
                      className={`h-[46px] text-[15px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-accent text-bg font-bold border border-accent'
                          : 'bg-transparent border border-border text-text'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {trainingDays && trainingDays > 0 && (
                <p className="text-[12px] text-text-secondary text-center mb-4">
                  {trainingHint(trainingDays)}
                </p>
              )}

              <button
                onClick={handleNext}
                disabled={selectedDays.length === 0}
                className="w-full bg-accent text-bg font-bold py-3 text-sm mt-4 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Step 6: Fitness goal */}
          {step === 'goal' && (
            <div className="w-full max-w-xs flex flex-col">
              <h2 className="text-[26px] font-bold mb-1 tracking-wide">Tu objetivo</h2>
              <p className="text-text-secondary text-[13px] mb-6">
                ¿Cuál es tu principal objetivo en el gimnasio?
              </p>

              <div className="flex flex-col gap-2 mb-6">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFitnessGoal(opt.value)}
                    className={`text-left px-4 py-3.5 text-sm transition-colors ${
                      fitnessGoal === opt.value
                        ? 'border border-accent bg-accent-dim font-bold'
                        : 'border border-border text-text'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={fitnessGoal === null}
                className="w-full bg-accent text-bg font-bold py-3 text-sm disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Step 7: Experience level */}
          {step === 'experience' && (
            <div className="w-full max-w-xs flex flex-col">
              <h2 className="text-[26px] font-bold mb-1 tracking-wide">Tu nivel</h2>
              <p className="text-text-secondary text-[13px] mb-6">
                ¿Cuál consideras que es tu nivel actual?
              </p>

              <div className="flex flex-col gap-2 mb-6">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperienceLevel(opt.value)}
                    className={`text-left px-4 py-3.5 transition-colors ${
                      experienceLevel === opt.value
                        ? 'border border-accent bg-accent-dim'
                        : 'border border-border text-text'
                    }`}
                  >
                    <span className="text-sm font-bold block">{opt.label}</span>
                    <span className="text-[12px] text-text-secondary">{opt.description}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={experienceLevel === null}
                className="w-full bg-accent text-bg font-bold py-3 text-sm disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Step 8: Routine preference */}
          {step === 'routine_preference' && (
            <div className="w-full max-w-xs flex flex-col">
              <h2 className="text-[26px] font-bold mb-1 tracking-wide">¿Cómo empezamos?</h2>
              <p className="text-text-secondary text-[13px] mb-6">
                Elige cómo quieres comenzar tu entrenamiento.
              </p>

              <div className="flex flex-col gap-2 mb-6">
                {ROUTINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoutinePreference(opt.value)}
                    className={`text-left px-4 py-4 transition-colors ${
                      routinePreference === opt.value
                        ? 'border border-accent bg-accent-dim'
                        : 'border border-border text-text'
                    }`}
                  >
                    <span className="text-sm font-bold block">{opt.label}</span>
                    <span className="text-[12px] text-text-secondary">{opt.description}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={routinePreference === null}
                className="w-full bg-accent text-bg font-bold py-3 text-sm disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Step 9: Summary */}
          {step === 'summary' && (
            <div className="w-full max-w-xs flex flex-col items-center">
              <span className="text-[11px] tracking-[0.1em] uppercase text-accent mb-2">
                Todo listo
              </span>
              <h2 className="text-[26px] font-bold mb-6 tracking-wide text-center">Tu punto de partida</h2>

              {/* Stats grid */}
              <div className="grid grid-cols-2 w-full border border-border mb-6">
                <div className="p-4 border-r border-b border-border">
                  <span className="text-[11px] tracking-[0.08em] uppercase text-text-secondary block mb-1">Peso</span>
                  <span className="text-[26px] font-bold">
                    {weightKg || '—'}
                    <span className="text-sm text-text-secondary font-normal ml-1">kg</span>
                  </span>
                </div>
                <div className="p-4 border-b border-border">
                  <span className="text-[11px] tracking-[0.08em] uppercase text-text-secondary block mb-1">IMC</span>
                  <span className="text-[26px] font-bold">{bmi || '—'}</span>
                </div>
                <div className="p-4 border-r border-border">
                  <span className="text-[11px] tracking-[0.08em] uppercase text-text-secondary block mb-1">Grasa (PGC)</span>
                  <span className="text-[26px] font-bold">
                    {bodyFatPct || '—'}
                    {bodyFatPct && <span className="text-sm text-text-secondary font-normal ml-1">%</span>}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-[11px] tracking-[0.08em] uppercase text-text-secondary block mb-1">Músculo (MME)</span>
                  <span className="text-[26px] font-bold">
                    {muscleMassKg || '—'}
                    {muscleMassKg && <span className="text-sm text-text-secondary font-normal ml-1">kg</span>}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                {goalLabel && (
                  <span className="text-[11px] px-2.5 py-1 bg-accent-dim text-accent font-medium">
                    Objetivo: {goalLabel.toLowerCase()}
                  </span>
                )}
                {trainingDays && (
                  <span className="text-[11px] px-2.5 py-1 bg-surface text-text-secondary font-medium">
                    {trainingDays} días / semana
                  </span>
                )}
              </div>

              {error && (
                <p className="text-red text-[13px] text-center mb-3">{error}</p>
              )}

              {routinePreference === 'create_own' ? (
                <>
                  <button
                    onClick={handleGoToCreateRoutine}
                    disabled={saving}
                    className="w-full bg-accent text-bg font-bold py-3 text-sm disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Crear mi primera rutina'}
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={saving}
                    className="text-text-secondary text-sm font-medium mt-3 text-center"
                  >
                    Ir al inicio — la creo después
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="w-full bg-accent text-bg font-bold py-3 text-sm disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Empezar a entrenar'}
                </button>
              )}

              <span className="text-[11px] tracking-[0.1em] text-text-secondary mt-12">
                PASO {String(totalSteps).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
