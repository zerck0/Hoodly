import { ChevronRight, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

interface RateItem {
  name: string
  rate: string
  eq: string
}

interface SuggestedRatesCardProps {
  rates: RateItem[]
}

export function SuggestedRatesCard({ rates }: SuggestedRatesCardProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 leading-none">
        Grille de tarifs indicatifs
      </h2>
      <Card className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <CardContent className="p-6 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed font-light">
            Voici les recommandations de tarifs d'entraide issues des moyennes de transactions de votre quartier :
          </p>

          <div className="space-y-3">
            {rates.map((item) => (
              <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-snug">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-light mt-0.5">
                    Équivalent : {item.eq}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-[#2c308e] bg-[#e9eaf6]/60 border border-[#e9eaf6] px-2.5 py-1 rounded-full shrink-0">
                  {item.rate}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button className="w-full flex items-center justify-between text-xs font-bold text-[#2c308e] hover:text-[#2c308e]/80 transition-colors cursor-pointer">
              <span className="flex items-center gap-1">
                <HelpCircle className="h-4 w-4" />
                Comment fixer mes tarifs ?
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
