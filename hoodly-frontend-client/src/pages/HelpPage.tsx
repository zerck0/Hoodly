import { useState } from 'react'
import {
  Search,
  Mail,
  MessageSquare,
  FileText,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Coins,
  MapPin,
  HeartHandshake
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

const FAQ_ITEMS = [
  {
    question: "Comment rejoindre un quartier ?",
    answer: "Lors de votre inscription ou depuis votre profil, renseignez votre adresse postale. Notre algorithme vous associera automatiquement au quartier correspondant. Pour interagir et proposer des services, votre compte doit être validé par un modérateur du quartier qui vérifiera votre justificatif de domicile.",
    icon: MapPin
  },
  {
    question: "Comment fonctionne le système de points ?",
    answer: "Sur Hoodly, l'entraide peut être gratuite ou basée sur des points communautaires. Lorsque vous rendez service (bricolage, jardinage, cours, etc.), vous gagnez des points. Vous pouvez ensuite utiliser ces points pour demander de l'aide à votre tour. Vous commencez avec un solde de bienvenue gratuit de 100 points !",
    icon: Coins
  },
  {
    question: "Comment signer un contrat d'entraide ?",
    answer: "Pour chaque service payant, un contrat numérique est automatiquement généré. Les deux voisins doivent le signer électroniquement avant le début du service. Une fois le service réalisé et validé par le demandeur, la transaction de points est libérée de manière sécurisée.",
    icon: FileText
  },
  {
    question: "Comment signaler un incident dans le quartier ?",
    answer: "Si vous constatez un problème dans le quartier (dégradation, animal perdu, nuisances, etc.), rendez-vous sur l'onglet 'Incidents' et cliquez sur 'Signaler un incident'. Renseignez le titre, la description, la gravité et ajoutez une photo si besoin. Les voisins et le modérateur seront alertés.",
    icon: ShieldCheck
  },
  {
    question: "Mes données personnelles sont-elles protégées (RGPD) ?",
    answer: "Oui, entièrement. Hoodly respecte le règlement général sur la protection des données (RGPD). Vous pouvez à tout moment exporter l'intégralité de vos données personnelles sous format JSON ou demander l'anonymisation de votre compte depuis la page Paramètres de votre profil.",
    icon: HeartHandshake
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const filteredFaqs = FAQ_ITEMS.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 dark:text-gray-100 space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex p-3 bg-[#e9eaf6] dark:bg-indigo-950/40 rounded-2xl text-[#2c308e] dark:text-indigo-400">
          <LifeBuoy className="h-8 w-8 animate-spin-slow" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Aide & Support
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
          Une question sur le fonctionnement de Hoodly ? Besoin d'assistance ? Trouvez toutes les réponses ici ou contactez-nous directement.
        </p>
      </div>

      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une question (ex: points, contrat, incident...)"
          className="h-12 w-full rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-12 pr-4 text-sm shadow-xs focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 transition-all dark:text-white"
        />
      </div>

      <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold dark:text-white">Foire Aux Questions (FAQ)</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Les réponses aux questions les plus fréquentes sur notre plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredFaqs.length === 0 ? (
            <p className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
              Aucune réponse ne correspond à votre recherche. Essayez d'autres mots-clés.
            </p>
          ) : (
            filteredFaqs.map((faq, index) => {
              const Icon = faq.icon
              const isOpen = openFaqIndex === index
              return (
                <div key={index} className="py-4 first:pt-0 last:pb-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between text-left font-bold text-sm text-gray-900 dark:text-white hover:text-[#2c308e] dark:hover:text-indigo-400 cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5 text-gray-400 dark:text-gray-500 shrink-0" />
                      {faq.question}
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="mt-3 pl-7 text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-light animate-in fade-in slide-in-from-top-1 duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900 shadow-xs flex flex-col justify-between">
          <CardHeader className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-[#e9eaf6] dark:bg-indigo-950/30 text-[#2c308e] dark:text-indigo-400 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold dark:text-white">Support par E-mail</CardTitle>
            <CardDescription className="text-xs dark:text-gray-400">
              Notre équipe technique et support vous répond sous 24h ouvrées pour toute question complexe.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <a href="mailto:hoodlypro@gmail.com" className="inline-flex items-center gap-2 text-xs font-bold text-[#2c308e] dark:text-indigo-400 hover:underline">
              hoodlypro@gmail.com
            </a>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900 shadow-xs flex flex-col justify-between">
          <CardHeader className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-[#e9eaf6] dark:bg-indigo-950/30 text-[#2c308e] dark:text-indigo-400 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold dark:text-white">Modérateurs de Quartier</CardTitle>
            <CardDescription className="text-xs dark:text-gray-400">
              Pour des questions sur la validation de justificatifs ou des signalements locaux, contactez un modérateur.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button variant="outline" className="h-8 px-4 rounded-xl text-[10px] font-bold dark:border-gray-700 dark:text-white cursor-pointer active:scale-98" onClick={() => window.location.href = '/messages'}>
              Ouvrir la messagerie
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
