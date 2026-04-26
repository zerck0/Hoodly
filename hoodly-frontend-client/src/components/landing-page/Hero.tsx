import { LogIn } from 'lucide-react'
import heroImg from '../../assets/hero.png'
import logoImg from '../../assets/logo_hoodly.png'

interface HeroProps {
  onLogin: () => void
}

export default function Hero({ onLogin }: HeroProps) {
  return (
    <section className="w-full bg-[#fefefa]">
      <nav className="w-full flex items-center justify-between px-10 py-4 border-b border-gray-100 hero-animate hero-animate-1">
        <img
          src={logoImg}
          alt="Hoodly logo"
          className="h-28 w-auto"
        />
        <ul className="hidden md:flex items-center gap-8 list-none">
          {['Services', 'Quartiers', 'À propos', 'Contact'].map(item => (
            <li key={item}>
              <a
                href="#"
                className="text-sm font-medium relative group"
                style={{ color: '#2c308e' }}
              >
                {item}
                <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-[#2c308e] transition-all duration-300 ease-out group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>
        <button
          onClick={onLogin}
          className="flex items-center gap-2 text-white text-sm px-5 py-2.5 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#2c308e]/25 active:scale-95"
          style={{ background: '#2c308e' }}
        >
          <LogIn size={15} />
          Rejoindre
        </button>
      </nav>

      <div className="w-full max-w-[1200px] mx-auto px-6 pt-14 pb-0 flex flex-col items-center">
        <h1
          className="text-center font-normal mb-14 hero-animate hero-animate-2"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(64px, 9vw, 120px)',
            lineHeight: '1.05',
            letterSpacing: '-0.03em',
            color: '#2c308e',
          }}
        >
          Ensemble, c'est<br />
          <span style={{ color: '#2c308e' }}>mieux</span>
        </h1>

        <div className="w-full relative flex items-end justify-center hero-animate hero-animate-3">
          <div
            className="absolute left-0 bottom-0 rounded-3xl"
            style={{ width: '22%', height: '85%', zIndex: 0, background: '#c7c9e2' }}
          />
          <div
            className="absolute right-0 bottom-0 rounded-3xl"
            style={{ width: '22%', height: '85%', zIndex: 0, background: '#c7c9e2' }}
          />
          <div className="relative z-10 w-full max-w-[780px] bg-[#1c1c1e] rounded-[22px] p-3 shadow-2xl transition-shadow duration-500 hover:shadow-[0_25px_60px_rgba(44,48,142,0.15)]">
            <div className="flex justify-center mb-2">
              <div className="w-2 h-2 rounded-full bg-[#3a3a3c]" />
            </div>
            <img
              src={heroImg}
              alt="Vue du quartier"
              className="w-full object-cover object-center rounded-[14px]"
              style={{ height: 'clamp(220px, 28vw, 400px)' }}
            />
            <div className="flex justify-center mt-2">
              <div className="w-8 h-1 rounded-full bg-[#3a3a3c]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
