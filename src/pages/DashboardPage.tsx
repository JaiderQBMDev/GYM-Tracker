import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Flame, Trophy, Dumbbell, Settings, LogOut } from 'lucide-react'
import { useProfile, useDashboard } from '../hooks/useApi'
import { useAuthStore } from '../stores/auth'

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function DashboardPage() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const { data: profile } = useProfile()
  const { data: dashboard, isLoading } = useDashboard()
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
          <p className="text-[13px] text-text-secondary font-medium">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-[28px] font-bold leading-tight mt-0.5">
            {greeting} 👋
          </h1>
          <p className="text-lg font-bold text-text">{firstName}</p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-[42px] h-[42px] rounded-full bg-surface border-2 border-accent-border flex items-center justify-center text-[17px] font-bold text-accent"
          >
            {firstName.charAt(0).toUpperCase()}
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 bg-surface border border-border rounded-xl shadow-lg min-w-[180px] py-1 z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
                <p className="text-[11px] text-text-secondary truncate">{profile?.weight_unit === 'lb' ? 'Libras' : 'Kilogramos'}</p>
              </div>
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

      {/* Last completed session or next suggestion */}
      {dashboard?.last_session ? (
        <div
          className="mx-5 mt-4 bg-surface rounded-[18px] p-5 border border-accent-border relative overflow-hidden cursor-pointer"
          onClick={() => navigate(`/history`)}
        >
          <div className="absolute top-[-20px] right-[-20px] w-[110px] h-[110px] bg-[radial-gradient(circle,rgba(198,241,53,0.15)_0%,transparent_70%)] pointer-events-none" />
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center">
              <Trophy size={12} className="text-accent" />
            </div>
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
              Completado
            </span>
            {dashboard.last_session.has_pr && (
              <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">
                PR ↑
              </span>
            )}
          </div>
          <p className="text-xl font-bold">{dashboard.last_session.routine_name_snapshot}</p>
          <div className="flex gap-6 mt-3">
            <Stat value={String(dashboard.last_session.duration_minutes)} unit="min" />
            <Stat value={formatVolume(dashboard.last_session.total_volume_kg)} unit="kg volumen" />
            <Stat value={String(dashboard.last_session.total_sets)} unit="series" />
          </div>
        </div>
      ) : dashboard?.next_routine ? (
        <div
          className="mx-5 mt-4 bg-surface rounded-[18px] p-5 border border-accent-border relative overflow-hidden cursor-pointer"
          onClick={() => navigate(`/routines/${dashboard.next_routine!.id}`)}
        >
          <div className="absolute top-[-20px] right-[-20px] w-[110px] h-[110px] bg-[radial-gradient(circle,rgba(198,241,53,0.15)_0%,transparent_70%)] pointer-events-none" />
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center">
              <Dumbbell size={12} className="text-accent" />
            </div>
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
              Entrenamiento de hoy
            </span>
          </div>
          <p className="text-xl font-bold">{dashboard.next_routine.name}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-[13px] text-text-secondary">
              {dashboard.next_routine.exercise_count} ejercicios
            </span>
            <button className="ml-auto bg-accent text-bg text-sm font-bold px-5 py-2 rounded-lg">
              Iniciar
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-5 mt-4 bg-surface rounded-[18px] p-5 border border-border">
          <p className="text-text-secondary text-sm text-center">
            Crea tu primera rutina para empezar
          </p>
          <button
            onClick={() => navigate('/routines')}
            className="w-full mt-3 bg-accent text-bg text-sm font-bold py-2.5 rounded-lg"
          >
            Ir a Rutinas
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-3 mx-5 mt-4">
        <div className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame size={14} className="text-accent" />
            <span className="text-[11px] text-text-secondary font-medium">Racha</span>
          </div>
          <p className="text-2xl font-bold text-accent">{dashboard?.streak ?? 0}🔥</p>
        </div>
        <div className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <span className="text-[11px] text-text-secondary font-medium">Esta semana</span>
          <p className="text-2xl font-bold">{formatVolume(dashboard?.this_week?.total_volume_kg ?? 0)}</p>
          <span className="text-[11px] text-text-secondary">kg totales</span>
        </div>
      </div>

      {/* Admin link */}
      {profile?.is_admin && (
        <div
          className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-accent-border flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/admin/exercises')}
        >
          <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
            <Settings size={16} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Panel de administración</p>
            <p className="text-[11px] text-text-secondary">Gestionar ejercicios</p>
          </div>
        </div>
      )}

      {/* Weekly chart */}
      <div className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
        <p className="text-[11px] text-text-secondary font-medium mb-3">Esta semana</p>
        <div className="flex justify-between">
          {DAY_LABELS.map((day, i) => {
            const trained = dashboard?.training_days?.[i] ?? false
            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                    trained
                      ? 'bg-accent text-bg'
                      : 'bg-surface-alt text-text-secondary'
                  }`}
                >
                  {day}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-text-secondary">{unit}</p>
    </div>
  )
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.0', '')}k`
  return String(Math.round(kg))
}
