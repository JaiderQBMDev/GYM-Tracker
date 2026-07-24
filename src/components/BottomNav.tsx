import { NavLink } from 'react-router'
import { Home, Dumbbell, Play, TrendingUp, User } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/routines', icon: Dumbbell, label: 'Rutinas' },
  { to: '/session', icon: Play, label: 'Sesión' },
  { to: '/history', icon: TrendingUp, label: 'Progreso' },
  { to: '/body', icon: User, label: 'Cuerpo' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
