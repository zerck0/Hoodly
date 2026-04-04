import rueImg from '../assets/rue.png'

export default function CommunityImage() {
  return (
    <section className="bg-[#fefefa] px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <img
          src={rueImg}
          alt="Communauté de quartier - marché local"
          className="w-full h-[500px] rounded-3xl shadow-xl object-cover"
        />
      </div>
    </section>
  )
}
