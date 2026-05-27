/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Search, Globe, Inbox, Loader2, X } from 'lucide-react'
import { usersApi } from '../../services/api/user'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { toast } from 'sonner'

interface NeighborSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onStartConversation: (voisinId: string) => Promise<void>
}

export function NeighborSearchModal({
  isOpen,
  onClose,
  onStartConversation
}: NeighborSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchGlobal, setSearchGlobal] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchingNeighbors, setIsSearchingNeighbors] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingNeighbors(true)
      try {
        const { data } = await usersApi.searchVoisins(searchQuery, searchGlobal)
        setSearchResults(data)
      } catch {
        toast.error('Erreur lors de la recherche des voisins.')
      } finally {
        setIsSearchingNeighbors(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, searchGlobal, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-2xl max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full p-2 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug">
            💬 Nouveau message privé
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-light leading-relaxed">
            Trouvez un voisin et commencez à discuter directement avec lui.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="h-11 w-full rounded-2xl bg-gray-50 border border-gray-200 pl-10 pr-4 text-xs outline-none focus:bg-white focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-200/50">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#2c308e]" />
              <span className="text-xs font-semibold text-gray-700 select-none">
                Recherche à l'échelle de Woodly
              </span>
            </div>
            <input
              type="checkbox"
              id="searchGlobal"
              checked={searchGlobal}
              onChange={(e) => setSearchGlobal(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#2c308e] focus:ring-[#2c308e]/30 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              Résultats ({searchResults.length})
            </label>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-sans">
              {isSearchingNeighbors ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50/20 rounded-2xl border border-dashed border-gray-200">
                  <Inbox className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                  <p className="text-[10px] font-semibold">Aucun voisin trouvé</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Saisissez un nom ou changez de filtre.</p>
                </div>
              ) : (
                searchResults.map((voisin) => (
                  <button
                    key={voisin.id}
                    type="button"
                    onClick={() => onStartConversation(voisin.id)}
                    className="flex w-full items-center gap-3 p-2.5 rounded-2xl hover:bg-[#e9eaf6]/40 border border-transparent hover:border-gray-200/30 transition-all text-left group cursor-pointer"
                  >
                    <Avatar className="h-9 w-9 border border-gray-100 shrink-0">
                      <AvatarImage src={voisin.picture} alt={voisin.name} />
                      <AvatarFallback className="bg-[#2c308e] text-white font-bold text-xs">
                        {voisin.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#2c308e] transition-colors">
                        {voisin.name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {voisin.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
