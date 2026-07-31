import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/auth'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { RoutineDetailPage } from './pages/RoutineDetailPage'
import { CreateRoutinePage } from './pages/CreateRoutinePage'
import { AddExercisePage } from './pages/AddExercisePage'
import { ActiveSessionPage } from './pages/ActiveSessionPage'
import { HistoryPage } from './pages/HistoryPage'
import { ProgressPage } from './pages/ProgressPage'
import { BodyPage } from './pages/BodyPage'
import { AdminExercisesPage } from './pages/admin/AdminExercisesPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { LogPastSessionPage } from './pages/LogPastSessionPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="routines" element={<RoutinesPage />} />
            <Route path="routines/new" element={<CreateRoutinePage />} />
            <Route path="routines/new/exercises" element={<AddExercisePage />} />
            <Route path="routines/:id" element={<RoutineDetailPage />} />
            <Route path="session" element={<ActiveSessionPage />} />
            <Route path="session/:id" element={<ActiveSessionPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="log-past" element={<LogPastSessionPage />} />
            <Route path="progress/:exerciseId" element={<ProgressPage />} />
            <Route path="body" element={<BodyPage />} />
            <Route path="admin/exercises" element={<AdminExercisesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
