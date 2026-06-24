import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { PenTool, FileText } from 'lucide-react'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { getAccessToken } from '../../lib/axios'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

interface SignatureZone {
  page: number
  x: number
  y: number
  width: number
  height: number
  assignee: 'client' | 'provider'
}

interface PDFSignatureViewerProps {
  pdfUrl: string
  zones: SignatureZone[]
  clientSigned: boolean
  providerSigned: boolean
  clientSignatureImage?: string
  providerSignatureImage?: string
  userRole: 'client' | 'provider' | 'none'
  onSignZoneClick: (assignee: 'client' | 'provider') => void
}

export const PDFSignatureViewer: React.FC<PDFSignatureViewerProps> = ({
  pdfUrl,
  zones,
  clientSigned,
  providerSigned,
  clientSignatureImage,
  providerSignatureImage,
  userRole,
  onSignZoneClick,
}) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)

  useEffect(() => {
    let active = true
    const loadPDF = async () => {
      try {
        setLoading(true)
        const token = getAccessToken ? await getAccessToken() : ''
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          httpHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
        const doc = await loadingTask.promise
        if (!active) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setLoading(false)
      } catch (err) {
        console.error('Erreur chargement PDF:', err)
        setLoading(false)
      }
    }
    loadPDF()
    return () => {
      active = false
    }
  }, [pdfUrl])

  useEffect(() => {
    if (!pdfDoc) return
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage)
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext('2d')
        if (!context) return

        const desiredWidth = 595
        const viewportOriginal = page.getViewport({ scale: 1 })
        const scale = desiredWidth / viewportOriginal.width
        const viewport = page.getViewport({ scale })

        canvas.width = viewport.width
        canvas.height = viewport.height
        setPageSize({ width: viewport.width, height: viewport.height })

        const renderContext = {
          canvasContext: context,
          canvas: canvas,
          viewport: viewport,
        }
        await page.render(renderContext).promise
      } catch (err) {
        console.error('Erreur rendu page PDF:', err)
      }
    }
    renderPage()
  }, [pdfDoc, currentPage])

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-hidden w-full">
      <div className="flex items-center justify-between w-full max-w-[595px] bg-white px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm text-sm">
        <button
          type="button"
          disabled={currentPage <= 1 || loading}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="text-slate-600 hover:text-slate-900 disabled:text-slate-300 font-medium transition-colors"
        >
          Précédent
        </button>
        <span className="font-medium text-slate-700">
          Page {currentPage} sur {numPages || '?'}
        </span>
        <button
          type="button"
          disabled={currentPage >= numPages || loading}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="text-slate-600 hover:text-slate-900 disabled:text-slate-300 font-medium transition-colors"
        >
          Suivant
        </button>
      </div>

      <div
        className="relative bg-white shadow-md border border-slate-200 rounded-lg overflow-hidden"
        style={{ width: `${pageSize.width}px`, height: `${pageSize.height}px` }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {zones.map((zone, index) => {
          if (zone.page !== currentPage) return null
          const isClient = zone.assignee === 'client'
          const isSigned = isClient ? clientSigned : providerSigned
          const signatureImg = isClient ? clientSignatureImage : providerSignatureImage

          const canUserSign = userRole === zone.assignee && !isSigned

          return (
            <div
              key={index}
              style={{
                left: `${zone.x}px`,
                top: `${zone.y}px`,
                width: `${zone.width}px`,
                height: `${zone.height}px`,
              }}
              className={`absolute border rounded flex items-center justify-center p-1 transition-all ${
                isSigned
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800'
                  : canUserSign
                  ? 'border-dashed border-amber-500 bg-amber-50/60 hover:bg-amber-100/80 cursor-pointer animate-pulse text-amber-700 shadow-md shadow-amber-100 hover:scale-102'
                  : isClient
                  ? 'border-blue-400 bg-blue-50/20 text-blue-700 cursor-not-allowed opacity-60'
                  : 'border-purple-400 bg-purple-50/20 text-purple-700 cursor-not-allowed opacity-60'
              }`}
              onClick={() => {
                if (canUserSign) {
                  onSignZoneClick(zone.assignee)
                }
              }}
            >
              {isSigned && signatureImg ? (
                <img
                  src={signatureImg}
                  alt={`Signature ${zone.assignee}`}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  {canUserSign ? (
                    <>
                      <PenTool size={10} className="animate-bounce" />
                      Signez ici
                    </>
                  ) : (
                    <>
                      <FileText size={10} />
                      {isClient ? 'Sign. Client' : 'Sign. Prestataire'}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
