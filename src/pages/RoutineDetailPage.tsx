import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, Play } from 'lucide-react'
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
  const sorted = [...exercises].sort((a, b) => a.order_index - b.order_index)

  const muscleGroups = [...new Set(sorted.map((re) => re.exercises.muscle_group))]
  const estMinutes = sorted.reduce((acc, re) => {
    const setTime = re.target_sets * 0.75
    const restTime = (re.target_sets - 1) * (re.rest_seconds / 60)
    return acc + setTime + restTime
  }, 0)

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
        <h1 className="text-[26px] font-bold tracking-wide">{routine.name}</h1>
        <p className="text-[13px] text-text-secondary mt-1">
          {exercises.length} ejercicios · ~{Math.round(estMinutes)} min · {muscleGroups.join(', ')}
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
      </div>

      {/* Exercise table */}
      <div className="mx-5 bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[11px] text-text-secondary font-semibold uppercase tracking-[0.08em]">
            Ejercicios
          </span>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.06em] text-text-secondary border-b border-border/50">
              <th className="text-left px-4 py-2 font-medium w-8">#</th>
              <th className="text-left py-2 font-medium">Ejercicio</th>
              <th className="text-right px-4 py-2 font-medium">Series × Reps</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((re, i) => (
              <tr key={re.id} className="border-t border-border/30">
                <td className="px-4 py-3 text-text-secondary font-medium">{i + 1}</td>
                <td className="py-3">
                  <p className="font-semibold truncate">{re.exercises.name}</p>
                  <p className="text-[11px] text-text-secondary capitalize">
                    {re.exercises.muscle_group} · descanso {re.rest_seconds} s
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {re.target_sets} × {re.target_reps_min}–{re.target_reps_max}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-6" />
    </div>
  )
}
