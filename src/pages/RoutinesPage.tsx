import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, Star, ChevronRight } from 'lucide-react'
import { useRoutines } from '../hooks/useApi'

export function RoutinesPage() {
  const navigate = useNavigate()
  const { data: routines, isLoading } = useRoutines()
  const [search, setSearch] = useState('')

  const filtered = routines?.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="px-6 pt-4 pb-3">
        <h1 className="text-2xl font-bold">Mis Rutinas</h1>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar rutina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-alt border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Section label */}
      <p className="px-6 text-[11px] text-text-secondary font-semibold uppercase tracking-wider mb-2">
        Tus rutinas
      </p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="flex flex-col gap-2 px-5">
          {filtered.map((routine) => (
            <button
              key={routine.id}
              onClick={() => navigate(`/routines/${routine.id}`)}
              className="w-full bg-surface rounded-2xl p-4 border border-border text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[15px] truncate">{routine.name}</p>
                  {routine.is_favorite && (
                    <Star size={13} className="text-accent fill-accent flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[12px] text-text-secondary">
                    {routine.exercise_count} ejercicios
                  </span>
                  {routine.last_completed && (
                    <span className="text-[12px] text-text-secondary">
                      Últ: {formatDate(routine.last_completed)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-text-secondary flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-text-secondary text-sm">
            {search ? 'No se encontraron rutinas' : 'Aún no tienes rutinas'}
          </p>
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}
