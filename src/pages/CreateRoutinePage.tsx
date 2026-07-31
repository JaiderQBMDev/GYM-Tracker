import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Plus, GripVertical, Pencil } from 'lucide-react'
import { useCreateRoutineWithExercises } from '../hooks/useApi'
import { useRoutineBuilder } from '../stores/routineBuilder'
import { useState } from 'react'

const DAY_LABELS = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D']

export function CreateRoutinePage() {
  const navigate = useNavigate()
  const createRoutine = useCreateRoutineWithExercises()
  const {
    name, assignedDay, exercises,
    setName, setAssignedDay, removeExercise, updateExercise, reset,
  } = useRoutineBuilder()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    return () => {}
  }, [])

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0) return
    setSaving(true)
    setError('')
    try {
      await createRoutine.mutateAsync({
        name: name.trim(),
        assigned_day: assignedDay,
        exercises: exercises.map((ex, i) => ({
          exercise_id: ex.exercise.id,
          order_index: i,
          target_sets: ex.target_sets,
          target_reps_min: ex.target_reps_min,
          target_reps_max: ex.target_reps_max,
          rest_seconds: ex.rest_seconds,
        })),
      })
      reset()
      navigate('/routines', { replace: true })
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear la rutina')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    reset()
    navigate(-1)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={handleBack} className="p-1">
          <ChevronLeft size={24} className="text-text" />
        </button>
        <span className="text-[13px] text-text-secondary font-medium">Mis Rutinas</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <h1 className="text-[26px] font-bold tracking-wide mb-5">Nueva rutina</h1>

        {/* Routine name */}
        <label className="text-[12px] text-text-secondary mb-2 block">Nombre de la rutina</label>
        <input
          type="text"
          placeholder="Ej: Full body express"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-surface border border-border px-4 py-3 text-[15px] font-medium text-text placeholder:text-text-secondary focus:outline-none focus:border-accent mb-5"
        />

        {/* Assigned day */}
        <label className="text-[12px] text-text-secondary mb-2 block">Día asignado (opcional)</label>
        <div className="flex gap-2 mb-6">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setAssignedDay(assignedDay === i ? null : i)}
              className={`flex-1 h-[40px] text-[13px] font-medium transition-colors ${
                assignedDay === i
                  ? 'bg-accent text-bg font-bold'
                  : 'border border-border text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Exercise list header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] uppercase tracking-[0.08em] text-text-secondary font-semibold">
            Ejercicios · {exercises.length}
          </span>
          <button
            onClick={() => navigate('/routines/new/exercises')}
            className="text-[12px] text-accent font-semibold"
          >
            + Añadir ejercicio
          </button>
        </div>

        {/* Exercise list */}
        {exercises.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {exercises.map((item) => (
              <div key={item.exercise.id}>
                <div className="bg-surface border border-border rounded-lg px-3 py-3 flex items-center gap-2">
                  <GripVertical size={16} className="text-text-secondary flex-shrink-0 opacity-40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{item.exercise.name}</p>
                    <p className="text-[11px] text-text-secondary capitalize">
                      {item.exercise.muscle_group} · {item.target_sets} × {item.target_reps_min}–{item.target_reps_max} · descanso {item.rest_seconds} s
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingId(editingId === item.exercise.id ? null : item.exercise.id)}
                    className="text-text-secondary p-1"
                  >
                    <Pencil size={14} />
                  </button>
                </div>

                {editingId === item.exercise.id && (
                  <div className="bg-surface-alt border border-border border-t-0 rounded-b-lg px-4 py-3 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-text-secondary block mb-1">Series</label>
                        <input
                          type="number"
                          value={item.target_sets}
                          onChange={(e) => updateExercise(item.exercise.id, { target_sets: parseInt(e.target.value) || 1 })}
                          min={1}
                          max={20}
                          className="w-full bg-surface border border-border px-2 py-1.5 text-sm text-text focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-text-secondary block mb-1">Descanso (s)</label>
                        <input
                          type="number"
                          value={item.rest_seconds}
                          onChange={(e) => updateExercise(item.exercise.id, { rest_seconds: parseInt(e.target.value) || 0 })}
                          min={0}
                          step={15}
                          className="w-full bg-surface border border-border px-2 py-1.5 text-sm text-text focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-text-secondary block mb-1">Reps mín</label>
                        <input
                          type="number"
                          value={item.target_reps_min}
                          onChange={(e) => updateExercise(item.exercise.id, { target_reps_min: parseInt(e.target.value) || 1 })}
                          min={1}
                          className="w-full bg-surface border border-border px-2 py-1.5 text-sm text-text focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-text-secondary block mb-1">Reps máx</label>
                        <input
                          type="number"
                          value={item.target_reps_max}
                          onChange={(e) => updateExercise(item.exercise.id, { target_reps_max: parseInt(e.target.value) || 1 })}
                          min={1}
                          className="w-full bg-surface border border-border px-2 py-1.5 text-sm text-text focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => { removeExercise(item.exercise.id); setEditingId(null) }}
                      className="text-red text-[12px] font-medium mt-1 self-start"
                    >
                      Eliminar ejercicio
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add exercise button */}
        <button
          onClick={() => navigate('/routines/new/exercises')}
          className="w-full border border-dashed border-border rounded-lg py-4 text-sm text-text-secondary font-medium flex items-center justify-center gap-1.5"
        >
          <Plus size={14} />
          {exercises.length === 0 ? 'Añadir mi primer ejercicio' : 'Añadir otro ejercicio'}
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-6 pt-3 border-t border-border bg-bg">
        {error && <p className="text-red text-[13px] text-center mb-3">{error}</p>}
        <button
          onClick={handleSave}
          disabled={!name.trim() || exercises.length === 0 || saving}
          className="w-full bg-accent text-bg font-bold py-3.5 text-sm disabled:opacity-40"
        >
          {saving ? 'Guardando...' : 'Guardar rutina'}
        </button>
        {exercises.length === 0 && (
          <p className="text-[11px] text-text-secondary text-center mt-2">
            Añade al menos 1 ejercicio para guardar
          </p>
        )}
      </div>
    </div>
  )
}
