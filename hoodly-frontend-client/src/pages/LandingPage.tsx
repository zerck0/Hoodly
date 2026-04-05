import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import CommunityMap from '../components/CommunityMap'
import Footer from '../components/Footer'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

interface LandingPageProps {
  onLogin: () => void
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  useScrollAnimation()
  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <Hero onLogin={onLogin} />
      <Features />
      <HowItWorks />
      <CommunityMap />
      <Footer />
    </div>
  )
}
