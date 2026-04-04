import { useAuth0 } from '@auth0/auth0-react'
import LandingPage from './pages/LandingPage'

function App() {
  const { loginWithRedirect } = useAuth0()

  return <LandingPage onLogin={() => loginWithRedirect()} />
}

export default App
