import { Wrench, CalendarDays, Users, AlertTriangle } from 'lucide-react'

const features = [
  {
    icon: Wrench,
    title: 'Proposez des services',
    description: 'Partagez vos compétences avec vos voisins : cours de cuisine, bricolage, garde d\'enfants… Chaque talent compte pour renforcer les liens au quotidien.',
    accent: 'from-[#2c308e] to-[#4a4ec9]',
    iconBg: 'bg-[#2c308e]',
    span: 'lg:col-span-7',
  },
  {
    icon: CalendarDays,
    title: 'Organisez des événements',
    description: 'Créez des rencontres et activités : fêtes de quartier, ateliers, sorties sportives. Rassemblez votre communauté autour de moments forts.',
    accent: 'from-[#4a4ec9] to-[#6b6fd4]',
    iconBg: 'bg-[#4a4ec9]',
    span: 'lg:col-span-5',
  },
  {
    icon: Users,
    title: 'Gérez votre quartier',
    description: 'Collaborez sur les décisions importantes : votes, documents partagés, discussions. Donnez une voix à chaque habitant.',
    accent: 'from-[#6b6fd4] to-[#8b8edb]',
    iconBg: 'bg-[#6b6fd4]',
    span: 'lg:col-span-5',
  },
  {
    icon: AlertTriangle,
    title: 'Signalez un incident',
    description: 'Route dégradée, éclairage en panne, nuisances… Contribuez à un quartier plus sûr en alertant vos voisins et les autorités en un clic.',
    accent: 'from-[#2c308e] to-[#4a4ec9]',
    iconBg: 'bg-[#2c308e]',
    span: 'lg:col-span-7',
  },
]

export default function Features() {
  return (
    <section className="bg-[#fefefa] px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14" data-animate="fade-up">
          <h2
            className="text-4xl md:text-5xl font-bold text-[#2c308e] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Tout pour votre quartier
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Des outils pensés pour connecter, organiser et améliorer la vie de votre communauté.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              data-animate="fade-up"
              data-delay={String(index + 1)}
              className={`${feature.span} group relative overflow-hidden rounded-3xl bg-[#f5f4fb] border border-[#e8e7f0] p-8 md:p-10 cursor-default transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2c308e]/8`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <feature.icon size={26} className="text-white" />
              </div>

              <h3
                className="text-xl md:text-2xl font-bold text-[#2c308e] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {feature.title}
              </h3>
              <p className="text-gray-500 leading-relaxed text-[15px] md:text-base max-w-md">
                {feature.description}
              </p>

              <div className={`absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-br ${feature.accent} rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
