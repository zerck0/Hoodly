import { useState } from 'react'
import { useAuthStore } from '../../stores/auth.store'
import { usersApi } from '../../services/api/user'
import { motion } from 'motion/react'
import { Sparkles, Calendar, Phone, User as UserIcon } from 'lucide-react'

interface StepPersonalInfoProps {
  onNext: () => void
}

function StepPersonalInfo({ onNext }: StepPersonalInfoProps) {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '')
  const [civility, setCivility] = useState(user?.civility ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()

    if (phone.trim()) {
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
      if (!phoneRegex.test(phone.trim())) {
        setError('Le format du numéro de téléphone est incorrect (ex: 0612345678)')
        setLoading(false)
        return
      }
    }

    if (birthDate) {
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      if (age < 10) {
        setError('Vous devez avoir au moins 10 ans pour vous inscrire')
        setLoading(false)
        return
      }
    }

    try {
      const response = await usersApi.updateProfile({
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        birthDate: birthDate,
        civility: civility,
      })
      updateUser(response.data)
      onNext()
    } catch {
      setError('Erreur lors de la mise à jour de vos informations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto max-w-xl bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-100/50 border border-slate-100 relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col items-center text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0c3383] text-[10px] font-extrabold tracking-wider uppercase mb-2">
          <Sparkles size={11} className="animate-pulse" />
          <span>Ravi de vous compter parmi nous !</span>
        </div>

        <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Faisons connaissance
        </h2>

        <p className="mt-1.5 text-xs text-gray-400 font-light max-w-md leading-relaxed">
          Prenez une minute pour renseigner vos informations de base. Ces détails permettront à vos voisins de vous identifier chaleureusement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="firstName" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Prénom
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Jean"
                className="w-full pl-10 rounded-xl border border-gray-200 px-4 py-3 text-xs font-light focus:border-[#0c3383] focus:outline-none transition-all shadow-3xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="lastName" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Nom de famille
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Dupont"
                className="w-full pl-10 rounded-xl border border-gray-200 px-4 py-3 text-xs font-light focus:border-[#0c3383] focus:outline-none transition-all shadow-3xs"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="civility" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Civilité
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                id="civility"
                value={civility}
                onChange={(e) => setCivility(e.target.value)}
                className="w-full pl-10 rounded-xl border border-gray-200 px-4 py-3 text-xs font-light bg-white focus:border-[#0c3383] focus:outline-none transition-all shadow-3xs appearance-none cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                <option value="Monsieur">Monsieur</option>
                <option value="Madame">Madame</option>
                <option value="Autre">Autre</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="birthDate" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Date de naissance
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full pl-10 rounded-xl border border-gray-200 px-4 py-3 text-xs font-light focus:border-[#0c3383] focus:outline-none transition-all shadow-3xs"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="phone" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Numéro de téléphone
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="w-full pl-10 rounded-xl border border-gray-200 px-4 py-3 text-xs font-light focus:border-[#0c3383] focus:outline-none transition-all shadow-3xs"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || !firstName.trim() || !lastName.trim()}
          className="w-full rounded-2xl bg-[#0c3383] py-4 text-xs font-bold text-white transition-all hover:bg-opacity-95 hover:scale-102 disabled:cursor-not-allowed disabled:opacity-50 shadow-md shadow-blue-900/10 cursor-pointer mt-4"
        >
          {loading ? 'Enregistrement en cours...' : 'Continuer vers l\'adresse'}
        </button>
      </form>
    </motion.div>
  )
}

export default StepPersonalInfo
