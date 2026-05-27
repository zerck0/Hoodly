import { useState } from 'react'
import { Search, Filter, Sprout, Wrench, BookOpen, Baby, ShoppingBag, Dog } from 'lucide-react'

const CATEGORIES = [
  { name: 'Tous les services', value: 'Tous' },
  { name: 'Jardinage', value: 'Jardinage', icon: Sprout },
  { name: 'Bricolage', value: 'Bricolage', icon: Wrench },
  { name: 'Cours', value: 'Cours', icon: BookOpen },
  { name: 'Garde', value: 'Garde', icon: Baby },
  { name: 'Courses', value: 'Courses', icon: ShoppingBag },
  { name: 'Animaux', value: 'Animaux', icon: Dog }
]

interface ServiceFiltersProps {
  searchText: string
  onSearchChange: (val: string) => void
  activeCategory: string
  onCategoryChange: (val: string) => void
  filterType: 'tous' | 'offre' | 'demande'
  onTypeChange: (val: 'tous' | 'offre' | 'demande') => void
  filterTarif: 'tous' | 'gratuit' | 'payant'
  onTarifChange: (val: 'tous' | 'gratuit' | 'payant') => void
}

export function ServiceFilters({
  searchText,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  filterType,
  onTypeChange,
  filterTarif,
  onTarifChange
}: ServiceFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="space-y-4 shrink-0">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher une offre, un besoin d'entraide..."
            className="h-11 w-full rounded-2xl border border-gray-200/80 bg-white pl-11 pr-4 text-xs outline-none focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 shadow-3xs transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-11 px-4 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-3xs ${
            showFilters
              ? 'bg-[#2c308e] border-[#2c308e] text-white'
              : 'bg-white border-gray-200/80 text-gray-700 hover:border-gray-300'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isSelected = activeCategory === cat.value

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 cursor-pointer shadow-3xs hover:scale-102 active:scale-98 ${
                isSelected
                  ? 'bg-[#2c308e] border-[#2c308e] text-white'
                  : 'bg-white border-gray-200/60 text-gray-600 hover:border-gray-300'
              }`}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span>{cat.name}</span>
            </button>
          )
        })}
      </div>

      {showFilters && (
        <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-3 duration-200">
          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              Type d'entraide
            </label>
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/30">
              <button
                type="button"
                onClick={() => onTypeChange('tous')}
                className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
                  filterType === 'tous'
                    ? 'bg-white text-[#2c308e] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => onTypeChange('offre')}
                className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
                  filterType === 'offre'
                    ? 'bg-white text-[#2c308e] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Offres
              </button>
              <button
                type="button"
                onClick={() => onTypeChange('demande')}
                className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
                  filterType === 'demande'
                    ? 'bg-white text-[#2c308e] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Demandes
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              Barème de points
            </label>
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/30">
              <button
                type="button"
                onClick={() => onTarifChange('tous')}
                className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
                  filterTarif === 'tous'
                    ? 'bg-white text-[#2c308e] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => onTarifChange('gratuit')}
                className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
                  filterTarif === 'gratuit'
                    ? 'bg-white text-[#2c308e] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Gratuits
              </button>
              <button
                type="button"
                onClick={() => onTarifChange('payant')}
                className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
                  filterTarif === 'payant'
                    ? 'bg-white text-[#2c308e] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Avec points
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
