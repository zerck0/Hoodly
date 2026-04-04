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
    description: 'Rejoignez votre quartier et descubrez vos voisins.',
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
            <h2 className="text-4xl md:text-5xl font-bold text-[#2c308e] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              Comment ça marche ?
            </h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#2c308e] rounded-full flex items-center justify-center flex-shrink-0">
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
              src={mapImg}
              alt="Vue aérienne du quartier"
              className="w-full rounded-3xl shadow-xl object-cover h-[400px]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
