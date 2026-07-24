import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, X, Check, SkipForward } from 'lucide-react'
import { useSessionDetail, useLogSet, useFinishSession, useRoutineDetail } from '../hooks/useApi'
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

  if (!session && !active) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-text-secondary text-sm text-center">
          No hay sesión activa. Inicia una desde tus rutinas.
        </p>
        <button
          onClick={() => navigate('/routines')}
          className="bg-accent text-bg font-bold py-2.5 px-6 rounded-lg text-sm"
        >
          Ir a Rutinas
        </button>
      </div>
    )
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Timer header */}
      <div className="flex justify-between items-center px-6 pt-4 pb-1">
        <span className="text-[15px] font-semibold">Sesión activa</span>
        <span className="text-[15px] font-bold text-accent tabular-nums">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Routine name */}
      <div className="flex justify-between items-center px-5 py-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] text-text-secondary">
            {active?.routineName ?? session?.routine_name_snapshot}
          </span>
        </div>
        <button
          onClick={() => handleFinish('cancelled')}
          className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center"
        >
          <X size={16} className="text-text-secondary" />
        </button>
      </div>

      {/* Exercise nav card */}
      {currentExercise && (
        <div className="mx-5 mt-2 bg-surface rounded-[14px] p-4 border border-border">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentExIdx((i) => Math.max(0, i - 1))}
              disabled={currentExIdx === 0}
              className="w-7 h-7 rounded-lg bg-surface-alt flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center flex flex-col items-center">
              {currentExercise.exercises.image_url && (
                <img
                  src={currentExercise.exercises.image_url}
                  alt={currentExercise.exercises.name}
                  className="w-16 h-16 rounded-xl object-cover mb-2"
                />
              )}
              <p className="text-lg font-bold">{currentExercise.exercises.name}</p>
              <div className="flex gap-2 items-center justify-center mt-1">
                <span className="text-[11px] text-text-secondary bg-surface-alt px-2.5 py-0.5 rounded-full">
                  {currentExercise.exercises.muscle_group}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {currentExIdx + 1} de {exercises.length}
                </span>
              </div>
            </div>
            <button
              onClick={() => setCurrentExIdx((i) => Math.min(exercises.length - 1, i + 1))}
              disabled={currentExIdx === exercises.length - 1}
              className="w-7 h-7 rounded-lg bg-surface-alt flex items-center justify-center disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Rest countdown */}
      {resting && (
        <div className="mx-5 mt-3 bg-surface rounded-[14px] p-5 border border-accent-border text-center">
          <p className="text-[11px] text-accent font-semibold uppercase tracking-wider mb-2">
            Descansando
          </p>
          <p className="text-4xl font-bold text-accent tabular-nums">
            {Math.floor(restTime / 60)}:{String(restTime % 60).padStart(2, '0')}
          </p>
          <p className="text-[11px] text-text-secondary mt-1">restante</p>
          {completedSets.length > 0 && (
            <p className="text-[12px] text-text-secondary mt-3">
              Completaste Serie {completedSets.length} · {completedSets[completedSets.length - 1]?.reps} reps × {completedSets[completedSets.length - 1]?.weight_kg} kg
            </p>
          )}
          <button
            onClick={() => { setResting(false); setRestTime(0) }}
            className="mt-3 text-blue text-sm font-semibold flex items-center gap-1 mx-auto"
          >
            <SkipForward size={14} />
            Saltar descanso
          </button>
        </div>
      )}

      {/* Sets table */}
      <div className="mx-5 mt-3 bg-surface-alt rounded-[14px] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex px-4 py-2.5 bg-surface border-b border-border">
          <span className="w-[44px] text-[11px] font-semibold text-text-secondary text-center">SERIE</span>
          <span className="flex-1 text-[11px] font-semibold text-text-secondary text-center">REPS</span>
          <span className="flex-1 text-[11px] font-semibold text-text-secondary text-center">KG</span>
          <span className="w-[44px] text-[11px] font-semibold text-text-secondary text-center" />
        </div>

        {/* Completed rows */}
        {completedSets.map((set) => (
          <div key={set.id} className="flex items-center px-4 py-2.5 border-b border-border">
            <span className="w-[44px] text-center text-sm font-semibold text-text-secondary">
              {set.set_number}
            </span>
            <span className="flex-1 text-center text-sm font-medium">{set.reps}</span>
            <span className="flex-1 text-center text-sm font-medium">{set.weight_kg}</span>
            <div className="w-[44px] flex justify-center">
              {set.is_personal_record ? (
                <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-bold">PR</span>
              ) : (
                <Check size={16} className="text-green" />
              )}
            </div>
          </div>
        ))}

        {/* Input row */}
        {!resting && currentExercise && nextSetNumber <= currentExercise.target_sets && (
          <div className="flex items-center px-4 py-2.5 gap-2">
            <span className="w-[44px] text-center text-sm font-semibold text-accent">
              {nextSetNumber}
            </span>
            <input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-center text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="Kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.5"
              className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-center text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleLogSet}
              disabled={!reps || !weight || logSet.isPending}
              className="w-[44px] h-8 bg-accent rounded-lg flex items-center justify-center disabled:opacity-30"
            >
              <Check size={16} className="text-bg" />
            </button>
          </div>
        )}
      </div>

      {/* Finish button */}
      <div className="mt-auto px-5 py-4">
        <button
          onClick={() => handleFinish('completed')}
          disabled={finishSession.isPending}
          className="w-full bg-accent text-bg font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
        >
          {finishSession.isPending ? 'Finalizando...' : 'Finalizar sesión'}
        </button>
      </div>
    </div>
  )
}
