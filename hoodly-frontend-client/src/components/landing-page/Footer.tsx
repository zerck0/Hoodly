import { Heart } from 'lucide-react'
import logoImg from '../../assets/logo_hoodly.png'

export default function Footer() {
  return (
    <footer className="bg-[#fefefa] border-t border-gray-200 px-4 py-12">
      <div className="max-w-6xl mx-auto" data-animate="fade-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <img
                src={logoImg}
                alt="Hoodly logo"
                className="h-16 w-auto"
              />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              La plateforme collaborative qui connecte les quartiers et renforce les liens de voisinage.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#2c308e] mb-4">Plateforme</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">Comment ça marche</a></li>
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">Communauté</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#2c308e] mb-4">À propos</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">Notre mission</a></li>
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">L'équipe</a></li>
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#2c308e] mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">Conditions d'utilisation</a></li>
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-[#2c308e] transition-colors">Mentions légales</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
            &copy; {new Date().getFullYear()} Hoodly. Tous droits réservés.
            <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" />
          </p>
        </div>
      </div>
    </footer>
  )
}
