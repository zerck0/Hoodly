import Hero from '../components/landing-page/Hero'
import Features from '../components/landing-page/Features'
import HowItWorks from '../components/landing-page/HowItWorks'
import CommunityMap from '../components/landing-page/CommunityMap'
import Footer from '../components/landing-page/Footer'
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
