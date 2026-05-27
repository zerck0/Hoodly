import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import { Card } from '../ui/card'

export function PromoCTA() {
  return (
    <Card className="bg-[#1f224e] border-0 text-white rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between p-8 relative min-h-[300px]">
      <div className="absolute right-0 top-0 text-white/5 pointer-events-none">
        <HeartHandshake className="h-64 w-64 -translate-y-12 translate-x-12" />
      </div>

      <div className="space-y-4 z-10">
        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/90">
          <HeartHandshake className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
            Besoin d'autre chose ?
          </h3>
          <p className="text-xs text-white/60 mt-2 leading-relaxed font-light">
            Vous ne trouvez pas ce que vous cherchez ? Publiez une demande d'entraide pour mobiliser vos voisins !
          </p>
        </div>
      </div>

      <div className="z-10 mt-6">
        <Link
          to="/services/nouveau?type=demande"
          className="w-full inline-flex items-center justify-between text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl transition-all duration-200 border border-white/5 group"
        >
          Publier une demande
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </Card>
  )
}
