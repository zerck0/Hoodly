import Hero from '../components/Hero'
import Features from '../components/Features'
import CommunityImage from '../components/CommunityImage'
import HowItWorks from '../components/HowItWorks'
import CommunityMap from '../components/CommunityMap'
import Footer from '../components/Footer'

interface LandingPageProps {
  onLogin: () => void
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <Hero onLogin={onLogin} />
      <Features />
      <CommunityImage />
      <HowItWorks />
      <CommunityMap />
      <Footer />
    </div>
  )
}
