import { Wrench, CalendarDays, Users, AlertTriangle } from 'lucide-react'

const features = [
  {
    icon: Wrench,
    title: 'Proposez des services',
    description: 'Partagez vos compétences avec vos voisins et créez du lien au quotidien.',
  },
  {
    icon: CalendarDays,
    title: 'Organisez des événements',
    description: 'Créez des rencontres, ateliers et activités pour toute la communauté.',
  },
  {
    icon: Users,
    title: 'Gérez votre quartier',
    description: 'Collaborez sur les décisions et documents importants de votre zone.',
  },
  {
    icon: AlertTriangle,
    title: 'Signalez un incident',
    description: 'Contribuez à un quartier plus sûr en signalant les problèmes locaux.',
  },
]

export default function Features() {
  return (
    <section className="bg-[#fefefa] px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="relative text-center group">
              <div className="w-16 h-16 bg-[#2c308e]/10 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:bg-[#2c308e]/20 transition-colors">
                <feature.icon size={24} className="text-[#2c308e]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2c308e] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
