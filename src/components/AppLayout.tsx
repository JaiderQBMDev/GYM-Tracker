import { Outlet, Navigate } from 'react-router'
import { BottomNav } from './BottomNav'
import { useAuthStore } from '../stores/auth'
import { useProfile } from '../hooks/useApi'
import { useQueryClient } from '@tanstack/react-query'

export function AppLayout() {
  const { session, loading } = useAuthStore()
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile()
  const qc = useQueryClient()

  if (loading || (session && profileLoading)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (profileError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-text-secondary text-sm text-center">No se pudo cargar tu perfil. Verifica tu conexión e intenta de nuevo.</p>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['profile'] })}
          className="bg-accent text-bg font-bold px-6 py-2.5 rounded-lg text-sm"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (profile && profile.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      <Outlet />
      <BottomNav />
    </div>
  )
}
