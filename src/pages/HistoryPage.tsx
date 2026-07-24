import { useSessions } from '../hooks/useApi'
import { Clock, Layers, Weight } from 'lucide-react'

export function HistoryPage() {
  const { data: sessions, isLoading } = useSessions()

  const grouped = groupByWeek(sessions ?? [])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="px-6 pt-4 pb-3">
        <h1 className="text-2xl font-bold">Historial</h1>
      </div>

      {sessions && sessions.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-text-secondary text-sm">Aún no tienes sesiones registradas</p>
        </div>
      ) : (
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
                    className="bg-surface rounded-2xl p-4 border border-border"
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
                              PR ↑
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
      )}
    </div>
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

interface SessionItem {
  id: string
  routine_name_snapshot: string
  started_at: string
  duration_minutes: number | null
  total_sets: number
  total_volume_kg: number
  has_pr: boolean
}

function groupByWeek(sessions: SessionItem[]): [string, SessionItem[]][] {
  const now = new Date()
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfThisWeek.setHours(0, 0, 0, 0)

  const groups: Record<string, SessionItem[]> = {}

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
