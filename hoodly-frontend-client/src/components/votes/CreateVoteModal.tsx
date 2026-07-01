import React, { useState } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'
import { votesApi } from '../../services/api/votes'

interface CreateVoteModalProps {
  isOpen: boolean
  onClose: () => void
  zoneId: string
  onSuccess: () => void
}

export default function CreateVoteModal({ isOpen, onClose, zoneId, onSuccess }: CreateVoteModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Un vote nécessite au moins 2 options')
      return
    }
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    const filteredOptions = options.map((opt) => opt.trim()).filter(Boolean)
    if (filteredOptions.length < 2) {
      toast.error('Veuillez renseigner au moins 2 options valides')
      return
    }

    setSubmitting(true)
    try {
      const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      await votesApi.create({
        zoneId,
        title: title.trim(),
        description: description.trim() || undefined,
        options: filteredOptions,
        expirationDate: oneWeekFromNow,
        isAnonymous
      })

      toast.success('Votre proposition de vote a été soumise avec succès !')
      onSuccess()
      setTitle('')
      setDescription('')
      setOptions(['', ''])
      setIsAnonymous(true)
      onClose()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Une erreur est survenue lors de la création."
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1e224e]/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[#fefefa] rounded-[2rem] border border-gray-100 shadow-2xl p-6 overflow-y-auto max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={submitting}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Proposer un vote
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Les autres habitants pourront voter sur ce sujet après validation par un modérateur. Durée du vote : 1 semaine.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Question ou titre du vote
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Doit-on planter un cerisier dans la cour ?"
              className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e] text-sm"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Description (contexte)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expliquez brièvement l'intérêt de ce vote à vos voisins..."
              className="min-h-[80px] rounded-xl border-gray-200 focus:border-[#2c308e] text-sm p-3"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Options de réponse
            </label>
            <div className="space-y-2">
              {options.map((option, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="h-10 rounded-xl border-gray-200 focus:border-[#2c308e] text-sm flex-1"
                    disabled={submitting}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      disabled={submitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-1.5 text-xs text-[#2c308e] hover:text-[#2c308e]/80 font-bold mt-2 transition-colors"
              disabled={submitting}
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une option</span>
            </button>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#2c308e] focus:ring-[#2c308e] mt-0.5 cursor-pointer"
              disabled={submitting}
            />
            <div className="flex-1">
              <label htmlFor="isAnonymous" className="block text-xs font-bold text-gray-700 cursor-pointer select-none">
                Vote Anonyme
              </label>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {isAnonymous 
                  ? "Les votes de chacun resteront entièrement secrets (recommandé)."
                  : "Les choix et noms des participants seront visibles par tous sur les résultats."}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 border-gray-200 text-gray-500 rounded-xl h-11"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold rounded-xl h-11"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  <span>Soumission...</span>
                </>
              ) : (
                'Proposer'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
