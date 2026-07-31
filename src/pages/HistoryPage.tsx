import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Clock, Layers, Weight, Play, Trophy, ChevronRight, Plus } from 'lucide-react'
import { useSessions, useDashboard, useWeeklyVolume, useTrainedExercises } from '../hooks/useApi'
import type { SessionSummary, TrainedExercise } from '../hooks/useApi'

type Tab = 'sessions' | 'exercises'

export function HistoryPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('sessions')
  const { data: sessions, isLoading: sessionsLoading } = useSessions()
  const { data: dashboard } = useDashboard()
  const { data: weeklyVolume } = useWeeklyVolume()
  const { data: trainedExercises, isLoading: exercisesLoading } = useTrainedExercises()

  const grouped = groupByWeek(sessions ?? [])
  const isLoading = tab === 'sessions' ? sessionsLoading : exercisesLoading
  const isEmpty = tab === 'sessions' ? sessions?.length === 0 : trainedExercises?.length === 0

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-4 pb-3">
        <h1 className="text-2xl font-bold">Progreso</h1>
        <button
          onClick={() => navigate('/log-past')}
          className="bg-accent/15 text-accent font-semibold text-[12px] px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Plus size={14} />
          Sesión pasada
        </button>
      </div>

      {/* Tabs */}
      <div className="flex mx-5 mb-4 bg-surface-alt rounded-lg p-1 border border-border">
        <button
          onClick={() => setTab('sessions')}
          className={`flex-1 text-center py-2 text-[13px] font-semibold rounded-md transition-colors ${
            tab === 'sessions' ? 'bg-accent text-bg' : 'text-text-secondary'
          }`}
        >
          Sesiones
        </button>
        <button
          onClick={() => setTab('exercises')}
          className={`flex-1 text-center py-2 text-[13px] font-semibold rounded-md transition-colors ${
            tab === 'exercises' ? 'bg-accent text-bg' : 'text-text-secondary'
          }`}
        >
          Por ejercicio
        </button>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <svg width="200" height="80" viewBox="0 0 200 80" className="mb-6 opacity-30">
            <rect x="10" y="55" width="16" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" className="text-text-secondary" />
            <rect x="35" y="45" width="16" height="35" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" className="text-text-secondary" />
            <rect x="60" y="50" width="16" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" className="text-text-secondary" />
            <rect x="85" y="35" width="16" height="45" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" className="text-text-secondary" />
            <rect x="110" y="40" width="16" height="40" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" className="text-text-secondary" />
            <rect x="135" y="25" width="16" height="55" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" className="text-text-secondary" />
            <rect x="160" y="15" width="16" height="65" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" className="text-text-secondary" />
          </svg>
          <h2 className="text-[22px] font-bold mb-2">Aquí verás tu progreso</h2>
          <p className="text-text-secondary text-sm text-center mb-8 max-w-[300px]">
            Cada sesión suma: volumen semanal, récords personales y constancia. Todo empieza con el primer entrenamiento.
          </p>
          <button
            onClick={() => dashboard?.next_routine ? navigate(`/routines/${dashboard.next_routine.id}`) : navigate('/routines')}
            className="w-full max-w-[340px] bg-accent/80 text-bg text-sm font-bold py-3.5 flex items-center justify-center gap-2 rounded-lg"
          >
            <Play size={14} fill="currentColor" />
            Empezar mi primer entrenamiento
          </button>
        </div>
      ) : tab === 'sessions' ? (
        <div className="flex-1 overflow-y-auto">
          {/* Weekly volume chart */}
          {weeklyVolume && weeklyVolume.some((w) => w.volume_kg > 0) && (
            <VolumeChart data={weeklyVolume} />
          )}

          {/* Session list */}
          <div className="px-5 pb-6">
            {grouped.map(([label, items]) => (
              <div key={label} className="mb-4">
                <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mb-2">
                  {label}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className="bg-surface rounded-xl p-4 border border-border"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[12px] text-text-secondary">
                            {formatSessionDate(s.started_at)}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[15px]">{s.routine_name_snapshot}</p>
                            {s.has_pr && (
                              <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                                RP ↑
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <StatChip icon={Clock} value={`${s.duration_minutes ?? 0} min`} />
                        <StatChip icon={Layers} value={`${s.total_sets} series`} />
                        <StatChip icon={Weight} value={`${formatKg(s.total_volume_kg)} kg`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <ExerciseList exercises={trainedExercises ?? []} navigate={navigate} />
        </div>
      )}
    </div>
  )
}

function VolumeChart({ data }: { data: { week: string; volume_kg: number }[] }) {
  const maxVol = Math.max(...data.map((d) => d.volume_kg), 1)
  const chartHeight = 100

  return (
    <div className="mx-5 mb-4 bg-surface rounded-xl p-4 border border-border">
      <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mb-3">
        Volumen semanal (kg) · Últimas {data.length} semanas
      </p>
      <div className="flex items-end gap-1.5 h-[100px]">
        {data.map((d, i) => {
          const isLast = i === data.length - 1
          const height = d.volume_kg > 0 ? Math.max(8, (d.volume_kg / maxVol) * chartHeight) : 4
          return (
            <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-sm transition-all ${
                  isLast ? 'bg-accent' : 'bg-accent/40'
                } ${d.volume_kg === 0 ? 'opacity-20' : ''}`}
                style={{ height: `${height}px` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => {
          const weekDate = new Date(d.week)
          const label = weekDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
          const isLast = i === data.length - 1
          return (
            <span
              key={d.week}
              className={`flex-1 text-center text-[9px] ${
                isLast ? 'text-accent font-semibold' : 'text-text-secondary'
              }`}
            >
              {i === 0 || isLast || i % 2 === 0 ? label : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function ExerciseList({ exercises, navigate }: { exercises: TrainedExercise[]; navigate: (path: string) => void }) {
  const byGroup = exercises.reduce<Record<string, TrainedExercise[]>>((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {})

  return (
    <>
      {Object.entries(byGroup).map(([group, items]) => (
        <div key={group} className="mb-4">
          <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mb-2 capitalize">
            {group}
          </p>
          <div className="flex flex-col gap-1.5">
            {items.map((ex) => (
              <button
                key={ex.exercise_id}
                onClick={() => navigate(`/progress/${ex.exercise_id}`)}
                className="w-full bg-surface rounded-xl p-3.5 border border-border flex items-center gap-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate">{ex.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-text-secondary">
                      {ex.total_sets} series
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Último: {new Date(ex.last_performed).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ex.best_weight_kg > 0 && (
                    <div className="flex items-center gap-1">
                      <Trophy size={12} className="text-accent" />
                      <span className="text-[12px] text-accent font-semibold">{ex.best_weight_kg} kg</span>
                    </div>
                  )}
                  <ChevronRight size={16} className="text-text-secondary" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function StatChip({ icon: Icon, value }: { icon: typeof Clock; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <Icon size={12} className="text-text-secondary" />
      <span className="text-[12px] text-text-secondary">{value}</span>
    </div>
  )
}

function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.0', '')}k`
  return String(Math.round(kg))
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const formatted = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  return isToday ? `${formatted} · Hoy` : formatted
}

function groupByWeek(sessions: SessionSummary[]): [string, SessionSummary[]][] {
  const now = new Date()
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfThisWeek.setHours(0, 0, 0, 0)

  const groups: Record<string, SessionSummary[]> = {}

  for (const s of sessions) {
    const d = new Date(s.started_at)
    let label: string
    if (d >= startOfThisWeek) {
      label = 'Esta semana'
    } else {
      const diff = Math.floor((startOfThisWeek.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000))
      label = diff === 0 ? 'Semana pasada' : `Hace ${diff + 1} semanas`
    }
    if (!groups[label]) groups[label] = []
    groups[label].push(s)
  }

  return Object.entries(groups)
}
