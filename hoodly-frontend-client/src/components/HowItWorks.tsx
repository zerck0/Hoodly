import mapImg from '../assets/map.png'

const steps = [
  {
    number: '01',
    title: 'Inscription',
    description: 'Créez votre compte en quelques secondes avec votre email.',
  },
  {
    number: '02',
    title: 'Connexion',
    description: 'Connectez-vous à votre espace personnel sécurisé.',
  },
  {
    number: '03',
    title: 'Quartier',
    description: 'Rejoignez votre quartier et découvrez vos voisins.',
  },
  {
    number: '04',
    title: 'Participation',
    description: 'Participez aux événements et échanges locaux.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-[#fefefa] px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2
              data-animate="fade-up"
              className="text-4xl md:text-5xl font-bold text-[#2c308e] mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Comment ça marche ?
            </h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  data-animate="fade-up"
                  data-delay={String(index + 1)}
                  className="flex items-start gap-4 group cursor-default"
                >
                  <div className="w-10 h-10 bg-[#2c308e] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#2c308e]/25">
                    <span className="text-white text-sm font-semibold">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2c308e] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <img
              data-animate="fade-left"
              src={mapImg}
              alt="Vue aérienne du quartier"
              className="w-full rounded-3xl shadow-xl object-cover h-[400px] transition-shadow duration-500 hover:shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
