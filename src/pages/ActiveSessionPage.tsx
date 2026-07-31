import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { X, Check, Play, Clock } from 'lucide-react'
import { useSessionDetail, useLogSet, useFinishSession, useRoutineDetail, useDashboard, useStartSession } from '../hooks/useApi'
import { useSessionStore } from '../stores/session'

export function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const active = useSessionStore((s) => s.active)
  const setActive = useSessionStore((s) => s.setActive)

  const sessionId = id ?? active?.id ?? ''
  const { data: session, refetch } = useSessionDetail(sessionId)
  const { data: routine } = useRoutineDetail(active?.routineId ?? '')
  const logSet = useLogSet()
  const finishSession = useFinishSession()

  const [currentExIdx, setCurrentExIdx] = useState(active?.currentExerciseIndex ?? 0)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [resting, setResting] = useState(false)
  const [restTime, setRestTime] = useState(0)

  const exercises = routine?.routine_exercises?.sort((a, b) => a.order_index - b.order_index) ?? []
  const currentExercise = exercises[currentExIdx]
  const currentExerciseSets = session?.sets?.filter((s) => s.exercise_id === currentExercise?.exercise_id) ?? []
  const completedSets = currentExerciseSets.filter((s) => s.is_completed)
  const nextSetNumber = completedSets.length + 1
  const nextExercise = exercises[currentExIdx + 1]

  // Timer
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!active?.startedAt) return
    const start = new Date(active.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [active?.startedAt])

  // Rest countdown
  useEffect(() => {
    if (!resting || restTime <= 0) return
    const iv = setInterval(() => {
      setRestTime((t) => {
        if (t <= 1) {
          setResting(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [resting, restTime])

  const handleLogSet = useCallback(async () => {
    if (!currentExercise || !reps || !weight) return
    await logSet.mutateAsync({
      sessionId,
      exercise_id: currentExercise.exercise_id,
      set_number: nextSetNumber,
      reps: parseInt(reps),
      weight_kg: parseFloat(weight),
    })
    setReps('')
    setWeight('')
    setResting(true)
    setRestTime(currentExercise.rest_seconds)
    refetch()
  }, [currentExercise, reps, weight, sessionId, nextSetNumber, logSet, refetch])

  const handleFinish = async (status: 'completed' | 'cancelled') => {
    await finishSession.mutateAsync({ id: sessionId, status })
    setActive(null)
    navigate('/')
  }

  const { data: dashboardData } = useDashboard()
  const startSession = useStartSession()
  const setActiveStore = useSessionStore((s) => s.setActive)

  const handleStartFromEmpty = async () => {
    if (!dashboardData?.next_routine) return
    const s = await startSession.mutateAsync(dashboardData.next_routine.id)
    setActiveStore({
      id: s.id,
      routineId: dashboardData.next_routine.id,
      routineName: dashboardData.next_routine.name,
      startedAt: s.started_at,
      currentExerciseIndex: 0,
    })
    navigate(`/session/${s.id}`)
  }

  if (!session && !active) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 border border-border flex items-center justify-center mb-6">
          <Play size={24} className="text-text-secondary" />
        </div>
        <h2 className="text-[22px] font-bold mb-2">No hay sesión activa</h2>
        {dashboardData?.next_routine ? (
          <>
            <p className="text-text-secondary text-sm text-center mb-8">
              Hoy te toca <span className="font-bold text-text">{dashboardData.next_routine.name}</span>. Cuando la inicies, aquí registrarás tus series.
            </p>
            <button
              onClick={handleStartFromEmpty}
              disabled={startSession.isPending}
              className="w-full bg-accent/80 text-bg text-sm font-bold py-3.5 flex items-center justify-center gap-2 rounded-lg disabled:opacity-50"
            >
              Iniciar entrenamiento de hoy
            </button>
            <button
              onClick={() => navigate('/routines')}
              className="mt-3 text-accent text-sm font-semibold"
            >
              Elegir otra rutina
            </button>
          </>
        ) : (
          <>
            <p className="text-text-secondary text-sm text-center mb-8">
              Crea una rutina para empezar a entrenar.
            </p>
            <button
              onClick={() => navigate('/routines')}
              className="w-full bg-accent/80 text-bg text-sm font-bold py-3.5 flex items-center justify-center gap-2 rounded-lg"
            >
              Ir a Rutinas
            </button>
          </>
        )}
      </div>
    )
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const hasPR = currentExerciseSets.some((s) => s.is_personal_record)
  const prWeight = hasPR
    ? Math.max(...currentExerciseSets.filter((s) => s.is_personal_record).map((s) => s.weight_kg ?? 0))
    : null

  const lastSet = completedSets[completedSets.length - 1]

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start px-5 pt-4 pb-3 border-b border-border">
        <div>
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em] block">
            Sesión activa
          </span>
          <h1 className="text-[17px] font-bold mt-0.5">
            {active?.routineName ?? session?.routine_name_snapshot}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[22px] font-bold text-accent tabular-nums">
            {formatTime(elapsed)}
          </span>
          <button
            onClick={() => handleFinish('cancelled')}
            className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Exercise counter */}
      {currentExercise && (
        <div className="px-5 pt-3 pb-1">
          <span className="text-[12px] text-text-secondary">
            Ejercicio {currentExIdx + 1} de {exercises.length}
          </span>
        </div>
      )}

      {/* Exercise info + sets table — unified card */}
      {currentExercise && (
        <div className="mx-5 mt-2 bg-surface rounded-xl border border-border overflow-hidden">
          {/* Exercise info */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-text-secondary font-semibold uppercase tracking-[0.06em]">
                {currentExercise.exercises.muscle_group}
              </span>
              <span className="text-[11px] text-text-secondary">·</span>
              <span className="text-[11px] text-text-secondary">
                {currentExercise.target_sets} × {currentExercise.target_reps_min}
                {currentExercise.target_reps_max !== currentExercise.target_reps_min
                  ? `-${currentExercise.target_reps_max}`
                  : ''}
              </span>
            </div>
            <h2 className="text-[20px] font-bold">{currentExercise.exercises.name}</h2>
            {(lastSet || prWeight != null) && (
              <p className="text-[12px] text-text-secondary mt-1">
                {lastSet && (
                  <span>Última vez: {lastSet.weight_kg} kg × {lastSet.reps}</span>
                )}
                {lastSet && prWeight != null && <span> · </span>}
                {prWeight != null && (
                  <span className="text-accent font-semibold">RP {prWeight} kg</span>
                )}
              </p>
            )}
          </div>

          {/* Sets table header */}
          <div className="flex px-4 py-2 border-t border-border">
            <span className="w-[50px] text-[11px] font-semibold text-text-secondary">SERIE</span>
            <span className="flex-1 text-[11px] font-semibold text-text-secondary text-center">KG</span>
            <span className="flex-1 text-[11px] font-semibold text-text-secondary text-center">REPS</span>
            <span className="w-[40px]" />
          </div>

          {/* Completed rows */}
          {completedSets.map((set) => (
            <div key={set.id} className="flex items-center px-4 py-2.5 border-t border-border">
              <span className="w-[50px] text-sm font-medium text-text-secondary">
                {set.set_number}
              </span>
              <span className="flex-1 text-center text-sm font-medium">{set.weight_kg}</span>
              <span className="flex-1 text-center text-sm font-medium">{set.reps}</span>
              <div className="w-[40px] flex justify-center">
                {set.is_personal_record ? (
                  <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-bold">PR</span>
                ) : (
                  <Check size={16} className="text-green" />
                )}
              </div>
            </div>
          ))}

          {/* Input row */}
          {nextSetNumber <= currentExercise.target_sets && (
            <div className="flex items-center px-3 py-2.5 gap-1.5 border-t border-border">
              <span className="w-[30px] text-sm font-semibold text-accent shrink-0">
                {nextSetNumber}
              </span>
              <input
                type="number"
                placeholder={String(lastSet?.weight_kg ?? '')}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                step="0.5"
                className="w-0 min-w-0 flex-1 bg-surface-alt border border-border rounded-lg px-2 py-1.5 text-sm text-center text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
              />
              <input
                type="number"
                placeholder="reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-0 min-w-0 flex-[0.7] bg-surface-alt border border-border rounded-lg px-2 py-1.5 text-sm text-center text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleLogSet}
                disabled={!reps || !weight || logSet.isPending}
                className="bg-accent text-bg text-[12px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-30 shrink-0"
              >
                Registrar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rest countdown */}
      {resting && (
        <div className="flex items-center justify-center gap-4 mx-5 mt-4 px-4 py-3 bg-surface rounded-xl border border-border">
          <Clock size={16} className="text-text-secondary" />
          <span className="text-[13px] text-text-secondary font-medium">Descanso</span>
          <span className="text-[22px] font-bold tabular-nums">
            {String(Math.floor(restTime / 60)).padStart(2, '0')}:{String(restTime % 60).padStart(2, '0')}
          </span>
          <button
            onClick={() => { setResting(false); setRestTime(0) }}
            className="text-accent text-[12px] font-semibold"
          >
            Saltar
          </button>
        </div>
      )}

      {/* Exercise navigation */}
      {exercises.length > 1 && (
        <div className="flex gap-3 mx-5 mt-4">
          <button
            onClick={() => setCurrentExIdx((i) => Math.max(0, i - 1))}
            disabled={currentExIdx === 0}
            className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-semibold text-text disabled:opacity-30 text-center"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentExIdx((i) => Math.min(exercises.length - 1, i + 1))}
            disabled={currentExIdx === exercises.length - 1}
            className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-semibold text-text disabled:opacity-30 text-center"
          >
            Siguiente ejercicio
          </button>
        </div>
      )}

      {/* Next exercise preview */}
      {nextExercise && (
        <p className="text-[12px] text-text-secondary text-center mt-3 px-5">
          Siguiente: {nextExercise.exercises.name} · {nextExercise.target_sets} × {nextExercise.target_reps_min}
          {nextExercise.target_reps_max !== nextExercise.target_reps_min
            ? `-${nextExercise.target_reps_max}`
            : ''}
        </p>
      )}

      {/* Finish session */}
      <div className="mt-auto px-5 py-4 text-center">
        <button
          onClick={() => handleFinish('completed')}
          disabled={finishSession.isPending}
          className="text-accent text-sm font-semibold disabled:opacity-50"
        >
          {finishSession.isPending ? 'Finalizando...' : 'Terminar sesión'}
        </button>
      </div>
    </div>
  )
}
