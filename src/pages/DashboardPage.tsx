import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Flame, Dumbbell, Settings, LogOut, Play, Moon } from 'lucide-react'
import { useProfile, useDashboard, useBodyMeasurements } from '../hooks/useApi'
import { useAuthStore } from '../stores/auth'

const DAY_LABELS = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D']

export function DashboardPage() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const { data: profile } = useProfile()
  const { data: dashboard, isLoading } = useDashboard()
  const { data: measurements } = useBodyMeasurements()

  const isNewUser = dashboard?.streak === 0 && !dashboard?.last_session
  const latestMeasurement = measurements?.[0]
  const heightM = profile?.height_cm ? profile.height_cm / 100 : null
  const bmi = latestMeasurement?.weight_kg && heightM
    ? (latestMeasurement.weight_kg / (heightM * heightM)).toFixed(1)
    : null

  const goalLabels: Record<string, string> = {
    lose_fat: 'perder grasa',
    gain_muscle: 'ganar músculo',
    improve_fitness: 'mejorar condición',
    increase_strength: 'ganar fuerza',
    stay_healthy: 'mantenerse sano',
    other: 'otro',
  }
  const levelLabels: Record<string, string> = {
    beginner: 'principiante',
    intermediate: 'intermedio',
    advanced: 'avanzado',
  }
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const todayDowIndex = (new Date().getDay() + 6) % 7

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex justify-between items-start px-6 pt-4 pb-2">
        <div>
          <p className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em]">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-[26px] font-bold leading-tight mt-0.5 tracking-wide">
            {greeting}, {firstName}
          </h1>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-[38px] h-[38px] bg-surface border border-accent-border flex items-center justify-center text-[16px] font-bold text-accent"
          >
            {firstName.charAt(0).toUpperCase()}
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 bg-surface border border-border rounded-xl shadow-lg min-w-[180px] py-1 z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
                <p className="text-[11px] text-text-secondary truncate">{profile?.weight_unit === 'lb' ? 'Libras' : 'Kilogramos'}</p>
              </div>
              {profile?.is_admin && (
                <button
                  onClick={() => { setShowMenu(false); navigate('/admin/exercises') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-surface-alt transition-colors"
                >
                  <Settings size={16} />
                  Panel de administración
                </button>
              )}
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red hover:bg-surface-alt transition-colors"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Today's workout card */}
      {dashboard?.next_routine && isNewUser ? (
        <div className="mx-5 mt-4 bg-surface rounded-[18px] p-5 border border-border">
          <span className="text-[11px] font-semibold text-accent uppercase tracking-[0.1em] block mb-1">
            Tu rutina te espera
          </span>
          <h3 className="text-[21px] font-bold mb-1">{dashboard.next_routine.name}</h3>
          <p className="text-[12px] text-text-secondary mb-4">
            La preparamos según tu perfil: {profile?.fitness_goal ? goalLabels[profile.fitness_goal] : ''} · {profile?.training_days_per_week ?? ''} días · {profile?.experience_level ? levelLabels[profile.experience_level] : ''}.
          </p>
          <button
            onClick={() => navigate(`/routines/${dashboard.next_routine!.id}`)}
            className="w-full bg-accent/80 text-bg text-sm font-bold py-3 flex items-center justify-center gap-2 rounded-lg"
          >
            <Play size={14} fill="currentColor" />
            Empezar mi primer entrenamiento
          </button>
        </div>
      ) : dashboard?.next_routine ? (
        <div
          className="mx-5 mt-4 bg-surface rounded-[18px] p-5 border border-accent-border relative overflow-hidden cursor-pointer"
          onClick={() => navigate(`/routines/${dashboard.next_routine!.id}`)}
        >
          <div className="absolute top-[-20px] right-[-20px] w-[110px] h-[110px] bg-[radial-gradient(circle,rgba(198,241,53,0.15)_0%,transparent_70%)] pointer-events-none" />
          <span className="text-[11px] font-semibold text-accent uppercase tracking-[0.1em] block mb-1">
            Entrenamiento de hoy
          </span>
          <h3 className="text-[21px] font-bold mb-1">{dashboard.next_routine.name}</h3>
          <p className="text-[12px] text-text-secondary mb-4">
            {dashboard.next_routine.exercise_count} ejercicios
          </p>
          <button className="w-full bg-accent text-bg text-sm font-bold py-3 flex items-center justify-center gap-2 rounded-lg">
            <Play size={14} fill="currentColor" />
            Iniciar sesión
          </button>
        </div>
      ) : dashboard?.is_rest_day ? (
        <div className="mx-5 mt-4 bg-surface rounded-[18px] p-5 border border-border text-center">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Moon size={24} className="text-accent" />
          </div>
          <span className="text-[11px] font-semibold text-accent uppercase tracking-[0.1em] block mb-1">
            Día de descanso
          </span>
          <h3 className="text-[21px] font-bold mb-1">Hoy toca recuperarse</h3>
          <p className="text-[12px] text-text-secondary">
            El descanso es parte del progreso.
          </p>
          {dashboard.upcoming_routine && (
            <p className="text-[12px] text-text-secondary mt-3 pt-3 border-t border-border">
              Próximo: <span className="text-text font-semibold">{dashboard.upcoming_routine.name}</span> · {dashboard.upcoming_routine.day_label}
            </p>
          )}
        </div>
      ) : dashboard?.last_session ? (
        <div
          className="mx-5 mt-4 bg-surface rounded-[18px] p-5 border border-accent-border relative overflow-hidden cursor-pointer"
          onClick={() => navigate('/history')}
        >
          <div className="absolute top-[-20px] right-[-20px] w-[110px] h-[110px] bg-[radial-gradient(circle,rgba(198,241,53,0.15)_0%,transparent_70%)] pointer-events-none" />
          <span className="text-[11px] font-semibold text-accent uppercase tracking-[0.1em] block mb-1">
            Última sesión
          </span>
          <h3 className="text-[21px] font-bold mb-1">{dashboard.last_session.routine_name_snapshot}</h3>
          <p className="text-[12px] text-text-secondary">
            {dashboard.last_session.duration_minutes} min · {dashboard.last_session.total_sets} series · {formatVolume(dashboard.last_session.total_volume_kg)} kg
            {dashboard.last_session.has_pr && (
              <span className="ml-2 text-[10px] bg-accent/20 text-accent px-2 py-0.5 font-semibold">RP ↑</span>
            )}
          </p>
        </div>
      ) : (
        <div className="mx-5 mt-4 bg-surface rounded-[18px] p-5 border border-border text-center">
          <span className="text-[11px] font-semibold text-accent uppercase tracking-[0.1em] block mb-2">
            Tu rutina te espera
          </span>
          <p className="text-text-secondary text-sm mb-4">
            Crea tu primera rutina para empezar a entrenar.
          </p>
          <button
            onClick={() => navigate('/routines')}
            className="w-full bg-accent text-bg text-sm font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Play size={14} fill="currentColor" />
            Empezar mi primer entrenamiento
          </button>
        </div>
      )}

      {/* Stats row */}
      {isNewUser && latestMeasurement ? (
        <div className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em] block mb-3">
            Tu punto de partida · {new Date(latestMeasurement.recorded_on).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-[0.06em] text-text-secondary block mb-1">Peso</span>
              <span className="text-[22px] font-bold">{latestMeasurement.weight_kg ?? '—'}</span>
              {latestMeasurement.weight_kg != null && <span className="text-[12px] text-text-secondary ml-1">kg</span>}
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[0.06em] text-text-secondary block mb-1">IMC</span>
              <span className="text-[22px] font-bold">{bmi ?? '—'}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[0.06em] text-text-secondary block mb-1">PGC</span>
              <span className="text-[22px] font-bold">{latestMeasurement.body_fat_pct ?? '—'}</span>
              {latestMeasurement.body_fat_pct != null && <span className="text-[12px] text-text-secondary ml-1">%</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 mx-5 mt-4">
          <div className="flex-1 bg-surface rounded-xl p-3.5 border border-border">
            <span className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em] block mb-1">
              Racha
            </span>
            <p className="text-[22px] font-bold">
              {dashboard?.streak ?? 0}
              <span className="text-[12px] text-text-secondary font-normal ml-1">semanas</span>
            </p>
          </div>
          <div className="flex-1 bg-surface rounded-xl p-3.5 border border-border">
            <span className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em] block mb-1">
              Esta semana
            </span>
            <p className="text-[22px] font-bold">
              {formatVolume(dashboard?.this_week?.total_volume_kg ?? 0)}
              <span className="text-[12px] text-text-secondary font-normal ml-1">kg</span>
            </p>
          </div>
        </div>
      )}

      {/* Consistency tracker */}
      <div className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
        <span className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em] block mb-3">
          {isNewUser ? 'Tu primera semana empieza hoy' : 'Consistencia'}
        </span>
        <div className="flex justify-between">
          {DAY_LABELS.map((day, i) => {
            const trained = dashboard?.training_days?.[i] ?? false
            const isToday = i === todayDowIndex
            return (
              <div
                key={day}
                className={`w-[34px] h-[34px] flex items-center justify-center text-[12px] font-medium ${
                  trained
                    ? 'bg-accent text-bg font-semibold'
                    : isToday
                      ? 'border border-dashed border-accent text-accent font-semibold'
                      : 'border border-border text-text-secondary'
                }`}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-6" />
    </div>
  )
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.0', '')}k`
  return String(Math.round(kg))
}
