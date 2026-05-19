import AppLayout from './app/AppLayout'
import LoginPage from './pages/LoginPage'
import RealtimeBridge from './services/RealtimeBridge'
import ErrorBoundary from './shared/ErrorBoundary'
import { useAuthStore } from './stores/authStore'

function App() {
  const user = useAuthStore((state) => state.user)

  if (!user) return <LoginPage />

  return (
    <ErrorBoundary>
      <RealtimeBridge />
      <AppLayout />
    </ErrorBoundary>
  )
}

export default App
