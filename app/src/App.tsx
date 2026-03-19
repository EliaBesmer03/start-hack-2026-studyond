import { useThesisStore } from '@/stores/thesis-store'
import { ThesisGPS } from '@/components/thesis-gps/ThesisGPS'
import { Dashboard } from '@/components/Dashboard'

function App() {
  const { profile } = useThesisStore()

  if (!profile.completedOnboarding) {
    return <ThesisGPS />
  }

  return <Dashboard />
}

export default App
