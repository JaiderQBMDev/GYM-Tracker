import { Outlet, Navigate } from 'react-router'
import { BottomNav } from './BottomNav'
import { useAuthStore } from '../stores/auth'

export function AppLayout() {
  const { session, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Outlet />
      <BottomNav />
    </div>
  )
}
