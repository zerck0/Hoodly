import quartierImg from '../assets/quartier.png'

export default function CommunityMap() {
  return (
    <section className="bg-[#fefefa] px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src={quartierImg}
              alt="Carte isométrique du quartier"
              className="w-full rounded-3xl shadow-xl object-cover"
            />
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#2c308e] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Qu'est-ce qu'un quartier pour nous ?
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Un quartier, c'est bien plus qu'un ensemble de rues et de bâtiments. C'est une communauté vivante,
              un espace de partage où chaque habitant contribue à rendre la vie meilleure. Chez Hoodly, nous
              croyons que la force d'un quartier réside dans les liens entre ses habitants.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg mt-4">
              Ensemble, construisons des voisins plus solidaires, des rues plus animées et un cadre de vie
              plus agréable pour tous.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
