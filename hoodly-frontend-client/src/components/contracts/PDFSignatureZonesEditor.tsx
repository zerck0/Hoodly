import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Plus, User, FileText, Trash } from 'lucide-react'

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export interface SignatureZone {
  page: number
  x: number
  y: number
  width: number
  height: number
  assignee: 'client' | 'provider'
}

interface PDFSignatureZonesEditorProps {
  pdfUrl: string
  zones: SignatureZone[]
  onChange: (zones: SignatureZone[]) => void
}

export const PDFSignatureZonesEditor: React.FC<PDFSignatureZonesEditorProps> = ({
  pdfUrl,
  zones,
  onChange,
}) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 }) // A4

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)

  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let active = true
    const loadPDF = async () => {
      try {
        setLoading(true)
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl })
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
        console.error('Erreur rendu de page PDF:', err)
      }
    }
    renderPage()
  }, [pdfDoc, currentPage])

  const addZone = (assignee: 'client' | 'provider') => {
    const newZone: SignatureZone = {
      page: currentPage,
      x: 100,
      y: 100,
      width: 150,
      height: 50,
      assignee,
    }
    onChange([...zones, newZone])
  }

  const deleteZone = (index: number) => {
    const filtered = zones.filter((_, i) => i !== index)
    onChange(filtered)
  }

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setActiveDragIndex(index)

    const zone = zones[index]
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setDragOffset({
      x: mouseX - zone.x,
      y: mouseY - zone.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeDragIndex === null) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    let newX = mouseX - dragOffset.x
    let newY = mouseY - dragOffset.y

    const zone = zones[activeDragIndex]
    newX = Math.max(0, Math.min(newX, pageSize.width - zone.width))
    newY = Math.max(0, Math.min(newY, pageSize.height - zone.height))

    const updatedZones = zones.map((z, i) => {
      if (i === activeDragIndex) {
        return { ...z, x: Math.round(newX), y: Math.round(newY) }
      }
      return z
    })

    onChange(updatedZones)
  }

  const handleMouseUp = () => {
    setActiveDragIndex(null)
  }

  const currentPageZones = zones.filter((z) => z.page === currentPage)

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="md:w-64 flex flex-col gap-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          Éditeur de zones
        </h3>
        <p className="text-xs text-slate-500">
          Ajoutez des zones de signature pour le client et le prestataire, puis faites-les glisser à l'endroit désigné.
        </p>

        <div className="flex flex-col gap-2 mt-2">
          <button
            type="button"
            onClick={() => addZone('client')}
            className="flex items-center justify-center gap-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all border border-blue-200/50 font-medium"
          >
            <Plus size={16} />
            Zone Client (Bleu)
          </button>
          <button
            type="button"
            onClick={() => addZone('provider')}
            className="flex items-center justify-center gap-2 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2.5 rounded-xl transition-all border border-purple-200/50 font-medium"
          >
            <Plus size={16} />
            Zone Prestataire (Violet)
          </button>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Zones de la page ({currentPageZones.length})
          </h4>
          {currentPageZones.length === 0 ? (
            <p className="text-xs italic text-slate-400">Aucune zone sur cette page</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {zones.map((zone, index) => {
                if (zone.page !== currentPage) return null
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                      zone.assignee === 'client'
                        ? 'bg-blue-50/30 border-blue-100 text-blue-800'
                        : 'bg-purple-50/30 border-purple-100 text-purple-800'
                    }`}
                  >
                    <span className="font-medium">
                      {zone.assignee === 'client' ? 'Client' : 'Prestataire'} (x: {zone.x}, y: {zone.y})
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteZone(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-hidden">
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
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative bg-white shadow-md border border-slate-200 rounded-lg overflow-hidden select-none"
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

            return (
              <div
                key={index}
                onMouseDown={(e) => handleMouseDown(e, index)}
                className={`absolute cursor-move border-2 rounded flex flex-col items-center justify-center p-1 backdrop-blur-[0.5px] group select-none transition-shadow ${
                  isClient
                    ? 'border-blue-500 bg-blue-100/40 text-blue-700 shadow-blue-100'
                    : 'border-purple-500 bg-purple-100/40 text-purple-700 shadow-purple-100'
                } ${activeDragIndex === index ? 'shadow-lg border-dashed' : 'shadow-sm'}`}
                style={{
                  left: `${zone.x}px`,
                  top: `${zone.y}px`,
                  width: `${zone.width}px`,
                  height: `${zone.height}px`,
                }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <User size={10} />
                  {isClient ? 'Sign. Client' : 'Sign. Prestataire'}
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => deleteZone(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                >
                  <Trash size={10} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
