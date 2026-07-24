import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, Play, Clock } from 'lucide-react'
import { useRoutineDetail, useStartSession } from '../hooks/useApi'
import { useSessionStore } from '../stores/session'

export function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: routine, isLoading } = useRoutineDetail(id!)
  const startSession = useStartSession()
  const setActive = useSessionStore((s) => s.setActive)

  const handleStart = async () => {
    if (!routine) return
    const session = await startSession.mutateAsync(routine.id)
    setActive({
      id: session.id,
      routineId: routine.id,
      routineName: routine.name,
      startedAt: session.started_at,
      currentExerciseIndex: 0,
    })
    navigate(`/session/${session.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!routine) return null

  const exercises = routine.routine_exercises ?? []

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={24} className="text-text" />
        </button>
        <span className="text-[13px] text-text-secondary font-medium">Mis Rutinas</span>
      </div>

      {/* Title + meta */}
      <div className="px-6 pb-4">
        <h1 className="text-2xl font-bold">{routine.name}</h1>
        <p className="text-[13px] text-text-secondary mt-1">
          {exercises.length} ejercicios · ~{exercises.length * 9} min estimados
        </p>
      </div>

      {/* Start button */}
      <div className="px-5 mb-4">
        <button
          onClick={handleStart}
          disabled={startSession.isPending}
          className="w-full bg-accent text-bg font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Play size={16} fill="currentColor" />
          {startSession.isPending ? 'Iniciando...' : 'Iniciar sesión'}
        </button>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Clock size={12} className="text-text-secondary" />
          <span className="text-[11px] text-text-secondary">
            ~{exercises.length * 9} min estimados
          </span>
        </div>
      </div>

      {/* Exercise list */}
      <p className="px-6 text-[11px] text-text-secondary font-semibold uppercase tracking-wider mb-2">
        Ejercicios
      </p>
      <div className="flex flex-col gap-2 px-5 pb-6">
        {exercises
          .sort((a, b) => a.order_index - b.order_index)
          .map((re, i) => (
            <div
              key={re.id}
              className="bg-surface rounded-xl p-4 border border-border flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-lg bg-surface-alt flex-shrink-0 overflow-hidden flex items-center justify-center">
                {re.exercises.image_url ? (
                  <img src={re.exercises.image_url} alt={re.exercises.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-text-secondary">{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] truncate">{re.exercises.name}</p>
                <p className="text-[12px] text-text-secondary capitalize">
                  {re.exercises.muscle_group} · {re.target_sets} × {re.target_reps_min}–{re.target_reps_max} reps
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
