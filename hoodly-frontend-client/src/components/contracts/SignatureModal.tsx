import React, { useState, useEffect } from 'react'
import { SignaturePad } from './SignaturePad'
import { contractsApi } from '../../services/api/contracts'
import { Check, AlertCircle, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SignatureModalProps {
  contractId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  contractId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [signatureImage, setSignatureImage] = useState<string>('')
  const [otp, setOtp] = useState<string>('')
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [loadingOtp, setLoadingOtp] = useState<boolean>(false)
  const [signing, setSigning] = useState<boolean>(false)
  const [consent, setConsent] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      handleSendOtp()
    }
    return () => {
      setSignatureImage('')
      setOtp('')
      setOtpSent(false)
      setConsent(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSendOtp = async () => {
    try {
      setLoadingOtp(true)
      await contractsApi.sendOtp(contractId)
      setOtpSent(true)
      toast.success('Code de vérification envoyé par e-mail.')
    } catch (err: any) {
      console.error(err)
      toast.error("Impossible d'envoyer le code OTP. Veuillez réessayer.")
    } finally {
      setLoadingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signatureImage) {
      toast.error('Veuillez dessiner votre signature avant de valider.')
      return
    }
    if (!otp || otp.length !== 6) {
      toast.error('Veuillez entrer le code OTP à 6 chiffres.')
      return
    }
    if (!consent) {
      toast.error('Vous devez accepter le consentement pour signer le document.')
      return
    }

    try {
      setSigning(true)
      await contractsApi.sign(contractId, {
        otp,
        signatureImage,
        signatureMetadata: window.navigator.userAgent,
      })
      toast.success('Votre signature a été enregistrée avec succès.')
      onSuccess()
      onClose()
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erreur lors de la signature.'
      toast.error(errorMsg)
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl flex flex-col relative animate-scale-up">
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <h3 className="text-lg font-bold">Signature Électronique</h3>
          <p className="text-xs text-slate-300 mt-1">
            Veuillez procéder à la signature et à la double vérification MFA par e-mail.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              1. Dessinez votre signature
            </label>
            <SignaturePad onSave={(img) => setSignatureImage(img)} onClear={() => setSignatureImage('')} />
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              2. Validation Double Facteur (MFA)
              {otpSent && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium Normal">
                  <Check size={10} /> Envoyé
                </span>
              )}
            </label>

            {!otpSent ? (
              loadingOtp ? (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-[#0c3383] font-medium bg-slate-50 border border-slate-100 rounded-xl">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Génération et envoi du code par e-mail...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-red-500 bg-rose-50/50 border border-rose-100 rounded-xl">
                  Impossible d'envoyer le code automatiquement.
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs font-bold underline ml-1 hover:text-red-700 cursor-pointer"
                  >
                    Réessayer
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <AlertCircle size={12} className="text-amber-500" />
                  Saisissez le code à 6 chiffres reçu par e-mail pour valider votre signature.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Entrez le code à 6 chiffres"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center font-mono text-lg tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loadingOtp}
                    className="text-xs text-[#0c3383] hover:text-[#0c3383]/80 px-3 py-2.5 font-medium border border-blue-100 rounded-xl hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    Renvoyer
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 items-start border-t border-slate-100 pt-4 bg-slate-50 -mx-6 px-6 py-4">
            <input
              type="checkbox"
              id="consent-check"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="consent-check" className="text-[11px] text-slate-500 cursor-pointer select-none leading-relaxed">
              En cochant cette case, je consens à signer numériquement ce document et je reconnais que ma signature a valeur légale sur la plateforme Hoodly conformément à l’article 1367 du Code Civil.
            </label>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={signing || !signatureImage || !otp || !consent}
              className="flex-1 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 font-medium text-sm transition-all"
            >
              {signing ? 'Signature...' : 'Signer le document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
