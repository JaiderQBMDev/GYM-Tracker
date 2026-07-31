import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Plus, Trash2, Search, X } from 'lucide-react'
import { useExercises, useLogPastSession, useRoutines } from '../hooks/useApi'
import type { Exercise } from '../hooks/useApi'

interface SetEntry {
  reps: string
  weight_kg: string
}

interface ExerciseEntry {
  exercise: Exercise
  sets: SetEntry[]
}

export function LogPastSessionPage() {
  const navigate = useNavigate()
  const logPast = useLogPastSession()
  const { data: routines } = useRoutines()

  const [routineName, setRoutineName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [duration, setDuration] = useState('')
  const [exercises, setExercises] = useState<ExerciseEntry[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const { data: allExercises } = useExercises(undefined, search || undefined)

  const canSubmit = routineName.trim() && date && exercises.length > 0 &&
    exercises.every((e) => e.sets.length > 0 && e.sets.every((s) => s.reps && s.weight_kg))

  const addExercise = (ex: Exercise) => {
    if (exercises.some((e) => e.exercise.id === ex.id)) return
    setExercises([...exercises, { exercise: ex, sets: [{ reps: '', weight_kg: '' }] }])
    setShowPicker(false)
    setSearch('')
  }

  const removeExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx))
  }

  const addSet = (exIdx: number) => {
    const updated = [...exercises]
    const lastSet = updated[exIdx]!.sets[updated[exIdx]!.sets.length - 1]
    updated[exIdx]!.sets.push({ reps: lastSet?.reps ?? '', weight_kg: lastSet?.weight_kg ?? '' })
    setExercises(updated)
  }

  const removeSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises]
    updated[exIdx]!.sets = updated[exIdx]!.sets.filter((_, i) => i !== setIdx)
    if (updated[exIdx]!.sets.length === 0) updated.splice(exIdx, 1)
    setExercises(updated)
  }

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetEntry, value: string) => {
    const updated = [...exercises]
    updated[exIdx]!.sets[setIdx] = { ...updated[exIdx]!.sets[setIdx]!, [field]: value }
    setExercises(updated)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    await logPast.mutateAsync({
      routine_name: routineName.trim(),
      date,
      duration_minutes: duration ? parseInt(duration) : undefined,
      exercises: exercises.map((e) => ({
        exercise_id: e.exercise.id,
        sets: e.sets.map((s) => ({
          reps: parseInt(s.reps),
          weight_kg: parseFloat(s.weight_kg),
        })),
      })),
    })
    navigate('/history')
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-0.5 -ml-1">
            <ChevronLeft size={22} className="text-text-secondary" />
          </button>
          <span className="text-[12px] text-text-secondary font-medium">Historial</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-wide">Registrar sesión pasada</h1>
      </div>

      {/* Session info */}
      <div className="px-5 flex flex-col gap-3 mb-4">
        <div>
          <label className="text-[12px] text-text-secondary mb-1 block">Nombre de la rutina</label>
          {routines && routines.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {routines.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoutineName(r.name)}
                  className={`text-[12px] px-2.5 py-1.5 rounded-lg border transition-colors ${
                    routineName === r.name
                      ? 'bg-accent/20 border-accent/40 text-accent'
                      : 'bg-surface-alt border-border text-text-secondary'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          ) : null}
          <input
            type="text"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="Ej: Pecho y tríceps"
            className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[12px] text-text-secondary mb-1 block">Fecha</label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent"
            />
          </div>
          <div className="w-[100px]">
            <label className="text-[12px] text-text-secondary mb-1 block">Duración (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider">
            Ejercicios ({exercises.length})
          </span>
          <button
            onClick={() => setShowPicker(true)}
            className="text-accent text-[12px] font-semibold flex items-center gap-1"
          >
            <Plus size={14} />
            Añadir
          </button>
        </div>

        {exercises.length === 0 && (
          <div className="bg-surface rounded-xl p-6 border border-border text-center">
            <p className="text-text-secondary text-sm">Añade los ejercicios que realizaste</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {exercises.map((ex, exIdx) => (
            <div key={ex.exercise.id} className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="flex justify-between items-center px-3.5 pt-3 pb-2">
                <div>
                  <p className="text-[14px] font-semibold">{ex.exercise.name}</p>
                  <p className="text-[11px] text-text-secondary capitalize">{ex.exercise.muscle_group}</p>
                </div>
                <button onClick={() => removeExercise(exIdx)} className="text-text-secondary p-1">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Sets header */}
              <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-3.5 pb-1">
                <span className="text-[10px] text-text-secondary font-medium">SET</span>
                <span className="text-[10px] text-text-secondary font-medium">KG</span>
                <span className="text-[10px] text-text-secondary font-medium">REPS</span>
                <span />
              </div>

              {/* Set rows */}
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-3.5 py-1 items-center">
                  <span className="text-[12px] text-text-secondary font-medium text-center">{setIdx + 1}</span>
                  <input
                    type="number"
                    step="0.5"
                    value={set.weight_kg}
                    onChange={(e) => updateSet(exIdx, setIdx, 'weight_kg', e.target.value)}
                    placeholder="0"
                    className="bg-surface-alt border border-border rounded-md px-2 py-1.5 text-[13px] text-text text-center focus:outline-none focus:border-accent"
                  />
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                    placeholder="0"
                    className="bg-surface-alt border border-border rounded-md px-2 py-1.5 text-[13px] text-text text-center focus:outline-none focus:border-accent"
                  />
                  <button onClick={() => removeSet(exIdx, setIdx)} className="text-text-secondary/50 p-0.5">
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSet(exIdx)}
                className="w-full py-2 text-[12px] text-accent font-semibold border-t border-border"
              >
                + Serie
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="px-5 pb-6 mt-auto">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || logPast.isPending}
          className="w-full bg-accent text-bg font-bold py-3.5 rounded-xl text-sm disabled:opacity-40"
        >
          {logPast.isPending ? 'Guardando...' : 'Guardar sesión'}
        </button>
      </div>

      {/* Exercise picker modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end">
          <div className="w-full bg-surface rounded-t-2xl max-h-[75vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-between items-center px-5 pt-5 pb-3">
              <h3 className="text-lg font-bold">Añadir ejercicio</h3>
              <button onClick={() => { setShowPicker(false); setSearch('') }} className="text-text-secondary p-1">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 mb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ejercicio..."
                  autoFocus
                  className="w-full bg-surface-alt border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {(allExercises ?? []).map((ex) => {
                const added = exercises.some((e) => e.exercise.id === ex.id)
                return (
                  <button
                    key={ex.id}
                    onClick={() => !added && addExercise(ex)}
                    disabled={added}
                    className={`w-full text-left py-3 border-b border-border/50 ${added ? 'opacity-40' : ''}`}
                  >
                    <p className="text-[14px] font-medium">{ex.name}</p>
                    <p className="text-[11px] text-text-secondary capitalize">{ex.muscle_group}{ex.equipment ? ` · ${ex.equipment}` : ''}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
