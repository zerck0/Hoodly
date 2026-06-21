import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi } from '../services/api/contracts'
import { useUser } from '../hooks/useUser'
import { PDFSignatureViewer } from '../components/contracts/PDFSignatureViewer'
import { SignatureModal } from '../components/contracts/SignatureModal'
import {
  Loader2,
  Calendar,
  ArrowLeft,
  Download,
  CheckCircle,
  User,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'pdf' | 'terms'>('pdf')

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('ID introuvable')
      const { data } = await contractsApi.getOne(id)
      return data
    },
    enabled: !!id,
  })

  // Mutation pour finaliser/valider le contrat
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      const { data } = await contractsApi.complete(id)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-detail', id] })
      toast.success('Le contrat a été validé et clôturé ! Les points ont été transférés.')
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.message || 'Erreur lors de la validation.'
      toast.error(errorMsg)
    },
  })

  // Mutation pour annuler le contrat
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      const { data } = await contractsApi.cancel(id)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-detail', id] })
      toast.success('Le contrat a été annulé avec succès.')
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.message || 'Erreur lors de l’annulation.'
      toast.error(errorMsg)
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 h-screen bg-slate-50">
        <Loader2 className="animate-spin text-[#0c3383]" size={36} />
        <p className="text-xs text-slate-500 mt-3">Chargement des détails du contrat...</p>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center mt-12 bg-white rounded-3xl border border-red-100 shadow-sm">
        <ShieldAlert size={48} className="text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Une erreur est survenue</h3>
        <p className="text-xs text-slate-500 mt-1">Impossible de récupérer les détails de ce contrat ou accès refusé.</p>
        <Button onClick={() => navigate('/contrats')} className="mt-4 bg-slate-900 text-white rounded-xl text-xs px-4 py-2">
          Retour aux documents
        </Button>
      </div>
    )
  }

  const isClient = contract.clientId?._id === user?.id
  const isProvider = contract.providerId?._id === user?.id
  const currentUserRole = isClient ? 'client' : isProvider ? 'provider' : 'none'

  const clientSigned = contract.clientSignature.signed
  const providerSigned = contract.providerSignature.signed

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">En attente de signature</Badge>
      case 'signed':
        return <Badge className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">Signé - En cours</Badge>
      case 'completed':
        return <Badge className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">Clôturé & Finalisé</Badge>
      case 'cancelled':
        return <Badge className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">Annulé</Badge>
      default:
        return <Badge className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">{status}</Badge>
    }
  }

  const handleSignZoneClick = () => {
    setModalOpen(true)
  }

  // URLs via Backend Proxy
  const templateDocId = contract.templateDocumentId?._id || contract.templateDocumentId
  const signedDocId = contract.signedDocumentId?._id || contract.signedDocumentId
  const activeDocId = signedDocId || templateDocId
  const pdfProxyUrl = activeDocId ? `${import.meta.env.VITE_API_URL}/documents/${activeDocId}/pdf` : ''
  const activeZones = signedDocId ? [] : contract.signatureZones

  const canSign = currentUserRole !== 'none' && (
    (currentUserRole === 'client' && !clientSigned) ||
    (currentUserRole === 'provider' && !providerSigned)
  ) && contract.status === 'pending'

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24 space-y-8 animate-in fade-in duration-300">
      {/* Bouton retour */}
      <button
        onClick={() => navigate('/contrats')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium font-sans cursor-pointer"
      >
        <ArrowLeft size={16} />
        Retour aux contrats
      </button>

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-2xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap font-sans">
            {getStatusBadge(contract.status)}
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Calendar size={12} />
              Créé le {format(new Date(contract.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
            {contract.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 font-sans">
          {/* Actions de téléchargement */}
          {contract.status === 'completed' && pdfProxyUrl && (
            <a
              href={pdfProxyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#0c3383] hover:bg-[#0c3383]/95 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              <Download size={14} />
              Télécharger le PDF signé
            </a>
          )}

          {/* Validation finale (pour les services payants par le prestataire/créateur) */}
          {contract.status === 'signed' && (isClient || isProvider) && contract.serviceId && (
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xs transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle size={14} />
              {completeMutation.isPending ? 'En cours...' : 'Valider la réalisation du service'}
            </Button>
          )}

          {/* Annulation du contrat */}
          {(contract.status === 'pending' || contract.status === 'signed') && (isClient || isProvider) && (
            <Button
              onClick={() => {
                if (window.confirm('Voulez-vous vraiment annuler ce contrat ?')) {
                  cancelMutation.mutate()
                }
              }}
              disabled={cancelMutation.isPending}
              className="bg-transparent hover:bg-rose-50 text-rose-600 border border-rose-200/50 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
            >
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Stepper de statut */}
      <div className="grid grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-2xs text-center relative overflow-hidden font-sans">
        {[
          { label: '1. Création', desc: 'Contrat généré', done: true, active: contract.status === 'pending' },
          { label: '2. Signatures', desc: 'Attente signatures', done: contract.status !== 'pending', active: contract.status === 'pending' },
          { label: '3. Séquestre', desc: contract.status === 'pending' ? 'Attente fonds' : 'Fonds sécurisés', done: contract.status === 'signed' || contract.status === 'completed', active: contract.status === 'signed' },
          { label: '4. Clôturé', desc: 'Service validé & payé', done: contract.status === 'completed', active: contract.status === 'completed' },
        ].map((step, idx) => (
          <div key={idx} className="flex flex-col items-center relative z-10">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
              step.done
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-3xs'
                : step.active
                ? 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse'
                : 'bg-slate-50 text-slate-300 border-slate-100'
            }`}>
              {step.done && contract.status !== 'cancelled' ? '✓' : idx + 1}
            </div>
            <span className={`text-[10px] font-bold mt-2 ${step.active || step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</span>
            <span className="text-[8px] font-light text-slate-400 mt-0.5">{contract.status === 'cancelled' && step.active ? 'Contrat Annulé' : step.desc}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Visualiseur / Termes à gauche */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 gap-6 font-sans">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'pdf' ? 'text-[#0c3383] border-b-2 border-[#0c3383]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              📄 Document Officiel (PDF)
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'terms' ? 'text-[#0c3383] border-b-2 border-[#0c3383]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              📝 Conditions générales (Texte)
            </button>
          </div>

          {activeTab === 'pdf' ? (
            pdfProxyUrl ? (
              <PDFSignatureViewer
                pdfUrl={pdfProxyUrl}
                zones={activeZones}
                clientSigned={clientSigned}
                providerSigned={providerSigned}
                clientSignatureImage={contract.clientSignature.signatureImage}
                providerSignatureImage={contract.providerSignature.signatureImage}
                userRole={currentUserRole}
                onSignZoneClick={handleSignZoneClick}
              />
            ) : (
              <Card className="p-16 bg-white border border-gray-100 rounded-[2rem] text-center shadow-2xs">
                <p className="text-xs text-slate-400 italic">Aucun document PDF lié</p>
              </Card>
            )
          ) : (
            <Card className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-2xs font-sans">
              <div className="prose prose-slate max-w-none">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Contrat d'entraide de quartier</h3>
                <div className="text-xs text-slate-700 font-light whitespace-pre-wrap leading-relaxed">
                  {contract.terms}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar à droite */}
        <div className="space-y-6 font-sans">
          {/* Fiche de transaction */}
          <Card className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs overflow-hidden relative">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <span>Échange financier</span>
                <TrendingUp size={14} className="text-[#0c3383]" />
              </div>
              <div className="space-y-1">
                <span className="text-4xl font-extrabold block text-slate-900 tracking-tight">
                  🪙 {contract.pricePoints.toLocaleString()} <span className="text-sm font-normal text-slate-400">pts</span>
                </span>
                <div className="pt-2">
                  {contract.status === 'pending' && (
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Points réservés
                    </Badge>
                  )}
                  {contract.status === 'signed' && (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                      🔒 Séquestre activé
                    </Badge>
                  )}
                  {contract.status === 'completed' && (
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Paiement effectué
                    </Badge>
                  )}
                  {contract.status === 'cancelled' && (
                    <Badge className="bg-rose-50 text-rose-700 border border-rose-200/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Annulé & Remboursé
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4 text-xs font-light text-slate-500 leading-relaxed space-y-2">
                <span className="font-bold text-slate-800 block">Statut du séquestre :</span>
                {contract.status === 'pending' && (
                  <p>Les points requis seront automatiquement débités du client et placés sous séquestre dès que les deux parties auront signé le contrat.</p>
                )}
                {contract.status === 'signed' && (
                  <p className="text-emerald-700 font-medium">Les points ont été débités du client et sont conservés en toute sécurité par Hoodly. Ils seront transférés au prestataire dès la validation finale du service.</p>
                )}
                {contract.status === 'completed' && (
                  <p>Le service a été validé. Les points ont été transférés avec succès au prestataire.</p>
                )}
                {contract.status === 'cancelled' && (
                  <p>Le contrat a été annulé. Les points sous séquestre ont été entièrement remboursés sur le compte du client.</p>
                )}
              </div>
            </div>
          </Card>

          {/* États de signature */}
          <Card className="bg-white border border-slate-100 rounded-[2rem] shadow-2xs">
            <CardHeader className="border-b border-slate-50 p-6">
              <CardTitle className="text-sm font-bold text-slate-900">Signatures & Empreintes</CardTitle>
              <CardDescription className="text-[10px] text-slate-400 font-light mt-0.5">
                Suivi de la certification double facteur (OTP) et des métadonnées cryptographiques.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Client */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User size={14} className="text-[#0c3383]" />
                    {contract.clientId?.name || 'Voisin (Client)'}
                  </span>
                  {clientSigned ? (
                    <Badge className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded-full">Signé</Badge>
                  ) : (
                    <Badge className="bg-slate-100 border border-slate-200 text-slate-400 text-[9px] font-semibold px-2 py-0.5 rounded-full">En attente</Badge>
                  )}
                </div>
                {clientSigned && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1 font-light leading-relaxed">
                    <p><strong>Date :</strong> {format(new Date(contract.clientSignature.signedAt!), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                    <p><strong>IP :</strong> {contract.clientSignature.ipAddress}</p>
                    <p className="truncate"><strong>Metadata :</strong> {contract.clientSignature.signatureMetadata}</p>
                    <p className="font-mono text-[8px] bg-slate-100 p-1.5 rounded text-slate-600 truncate"><strong>Hash :</strong> {contract.clientSignature.hash}</p>
                  </div>
                )}
              </div>

              {/* Provider */}
              <div className="space-y-2 border-t border-slate-50 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User size={14} className="text-[#0c3383]" />
                    {contract.providerId?.name || 'Voisin (Prestataire)'}
                  </span>
                  {providerSigned ? (
                    <Badge className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded-full">Signé</Badge>
                  ) : (
                    <Badge className="bg-slate-100 border border-slate-200 text-slate-400 text-[9px] font-semibold px-2 py-0.5 rounded-full">En attente</Badge>
                  )}
                </div>
                {providerSigned && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1 font-light leading-relaxed">
                    <p><strong>Date :</strong> {format(new Date(contract.providerSignature.signedAt!), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                    <p><strong>IP :</strong> {contract.providerSignature.ipAddress}</p>
                    <p className="truncate"><strong>Metadata :</strong> {contract.providerSignature.signatureMetadata}</p>
                    <p className="font-mono text-[8px] bg-slate-100 p-1.5 rounded text-slate-600 truncate"><strong>Hash :</strong> {contract.providerSignature.hash}</p>
                  </div>
                )}
              </div>

              {/* Action de signature directe */}
              {canSign && (
                <Button
                  onClick={handleSignZoneClick}
                  className="w-full bg-[#0c3383] hover:bg-[#0c3383]/95 text-white font-bold text-xs py-3.5 rounded-xl shadow-xs transition-all hover:scale-102 flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  ✍️ Signer le contrat maintenant
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {id && (
        <SignatureModal
          contractId={id}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['contract-detail', id] })
          }}
        />
      )}
    </div>
  )
}
